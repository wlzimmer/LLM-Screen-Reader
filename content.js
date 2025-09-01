//Process request from Python (sent through background.js)
console.log ('content')
callTable = {
	'log': 				wlz_log,
	'extractPageData':	wlz_extractPageData
/* 	'splitMain': wlz_splitMain,
	'domScraper': wlz_domScraper,	
	'putValue': wlz_putValue,
	'click': wlz_click,
	'scrollTo': wlz_scrollTo,
	'scrollScreen': wlz_scrollScreen,
	'drawBorder': wlz_drawBorder,
	'newURL': wlz_newURL,
	'prevURL': wlz_prevURL,
	'reload': wlz_reload,
	'current': wlz_current,
	'seqMap': 'wlz_seqMap',
	'seqLookup': wlz_seqLookup */
}

chrome.runtime.sendMessage('Start:')

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
	try {
		console.log ('msg', msg)
		let index = msg.indexOf(':')			// Ignore all but first ':'
		msg = [msg.slice(0, index), msg.slice(index + 1)]
		console.log (...msg[1].split('`'))
		if (msg[0] in callTable) {
			var ret = callTable[msg[0]] (...msg[1].split('`'))
			if (ret != null) {
				console.log ('ret != null', ret)
				console.log (msg[0] + ':' + JSON.stringify(ret))
				chrome.runtime.sendMessage(msg[0] + ':' + JSON.stringify(ret))
			}
		} else console.log ('...', msg[1])
		return false;
	} catch(err) {
		  console.log ('*...content', err.message, err.stack/* , '-', msg[0], ':', msg[1].slice(0,80), '-', ret.slice(0,80) */);
	}
});

document.addEventListener('keydown', onKeyDown) // WTF Can't remove if document.onKeyDown
function onKeyDown(event) {
	try {
		if (['Control', 'Shift', 'Alt'].includes(event.key)) return;
		key = event.key;
		if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Enter', 'Backspace', 'Delete', 'End', 'Home', 'Insert', 'ScrollLock', 'Tab', 'Pause'].includes(key)) key = 'Shift-' + key.trim()
		if(event.altKey) key = 'Alt-' + key
		if (event.ctrlKey) key = 'Ctrl-'+ key
		chrome.runtime.sendMessage('KEY:'+ key);
		event.stopPropagation();
		event.preventDefault();
	} catch(err) {
		  console.log ('*...content', err.message, err.stack);
	}
};

function wlz_log () {
	console.log ('<=' + (Array.from(arguments)).join())
	return null
}

function wlz_extractPageData() {
	return ({
	  title: document.title,
	  content: (document.body.innerText),
	  elements: Array.from(document.querySelectorAll('button, input, a'))
		.map(el => ({
		  tag: el.tagName,
		  text: el.textContent || el.value,
		  type: el.type,
		  href: el.href
		})),
	  forms: Array.from(document.forms).map(form => ({
		action: form.action,
		fields: Array.from(form.elements).map(field => ({
		  name: field.name,
		  type: field.type,
		  placeholder: field.placeholder
		}))
	  }))
	})
}


