//Process request from Python (sent through background.js)
console.log ('content')
chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
	try {
		console.log ('...', msg.toString())
		return false;
	} catch(err) {
		  console.log ('*...content', err.message, err.stack, '-', msg[0], ':', msg[1].slice(0,80), '-', result.slice(0,80));
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
		chrome.runtime.sendMessage(key);
		event.stopPropagation();
		event.preventDefault();
	} catch(err) {
		  console.log ('*...content', err.message, err.stack);
	}
};
