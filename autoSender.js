window.log = function () {
	console.log.apply(console, arguments);
};

window.onload = function () {
	window.autoSender = new AutoSender();
	autoSender.init()
};

function AutoSender() {
	var me = this;
	me.totalPage;
	me.currentPage;
	me.totalMember;
	me.sent;
	me.startButton;
	me.init = function () {
		$('body')[0].appendChild(getContainer());
		var total = document.querySelector('.sul_page span');
		var current = document.querySelector(".active3");
		var totMember = document.querySelector('.search-top-filter-left strong');
		me.totalPage = total ? parseInt(total.innerText) : 1;
		me.currentPage = current ? parseInt(current.innerText) : 1;
		me.totalMember = totMember ? parseInt(totMember.innerText) : 1;
		var sent = localStorage.getItem("sent");
		me.sentCounter = localStorage.getItem('auto-send-counter');
		me.sent = sent ? JSON.parse(sent) : {};
		if (localStorage.getItem('auto-send-started') == "1") {
			sendCurrentPage();
		}
		if (localStorage.getItem('fixed-url')) {
			enableStart();
		}
	};

	function sendCurrentPage() {
		showLoading();
		var carIds = [];
		$('.crl-body-ID').each(function (ind, dom) {
			carIds.push(dom.innerText.replace("ID ", ''))
		});
		sendToMembers(carIds, function () {
			localStorage.setItem('sent', JSON.stringify(me.sent));
			localStorage.setItem('auto-send-counter', me.sentCounter);
			if (me.totalPage === me.currentPage) {
				localStorage.setItem('auto-send-started', "0");
				localStorage.removeItem('fixed-url');
				return;
			}
			window.location.href = getNextPageUrl();
		});
	}

	function sendToMembers(carIds, calbeck) {
		var carId = carIds.shift();
		getUserIdByCarId(carId, function (userId) {
			sendMessage(userId, carId, function (res) {
				res = parseInt(res);
				if (res == 0) {
					return alert("შეტყობინების გაგზავნის დროს მოხდა შეცდომა");
				}
				me.sent[userId + "." + carId] = 1;
				me.sentCounter++;
				$('#sender-loading div').text(parseInt(me.sentCounter * 100 / me.totalMember) + "%");
				if (carIds.length === 0) {
					calbeck.call();
				} else {
					sendToMembers(carIds, calbeck);
				}
			});
		});
	}

	function getUserIdByCarId(carId, func) {
		$.get("./index.php?action=details&car_id=" + carId, function (res) {
			var userId = res.match(/user_id=[0-9]+/)[0].replace('user_id=', '');
			func(userId);
		});
	}

	function saveUrl() {
		if (window.location.href.match(/\?action=search/)) {
			localStorage.setItem('fixed-url', window.location.href);
			enableStart();
		} else {
			return;
		}
	}

	function getNextPageUrl() {
		return localStorage.getItem('fixed-url') + "&page=" + (me.currentPage + 1);
	}

	function startAutoSend() {
		localStorage.setItem('auto-send-started', "1");
		localStorage.setItem('auto-send-counter', "0");
		window.location.href += '&page=1';
	}

	function showLoading() {
		$('body').append('<div id="sender-loading"><div>0%</div></div>');
	}

	function getContainer() {
		var cont = document.createElement('div');
		cont.classList.add('my-container');
		var genButt = document.createElement('button');
		genButt.textContent = "ფილტრის დამახსოვრება";
		genButt.onclick = saveUrl;
		cont.appendChild(genButt);

		me.messageCont = document.createElement('textarea');
		me.messageCont.value = localStorage.getItem("send-message-text");
		me.messageCont.onkeyup = function () {
			localStorage.setItem("send-message-text", me.messageCont.value);
		};
		cont.appendChild(me.messageCont);

		me.startButton = document.createElement('button');
		me.startButton.textContent = "დაწყება";
		me.startButton.onclick = startAutoSend;
		cont.appendChild(me.startButton);
		disableStart();
		return cont;
	}

	function disableStart() {
		me.startButton.disabled = true;
		me.startButton.style.opacity = 0.5;
	}

	function enableStart() {
		me.startButton.disabled = false;
		me.startButton.style.opacity = 1;
	}

	function sendMessage(userId, carId, callback) {
		var text = localStorage.getItem("send-message-text");
		if (!text || text == '') return;
		if (me.sent[userId + "." + carId] == 1)
			return callback(1);
		$.post('ajax/modules/pms.php', {
			snmd: 1,
			user_id: userId,
			car_id: carId,
			text: text
		}, callback);
	}

}
