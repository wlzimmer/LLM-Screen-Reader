//Process request from Python (sent through background.js)
console.log ('content')
callTable = {
	'log': 				wlz_log,
	'extractPageData':	wlz_extractPageData,
	'extractTreeRag':	wlz_extractTreeRag,
	'isRunning':		wlz_isRunning
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


isRunning = localStorage.getItem("isRunning");
if (isRunning == 'true') 	isRunning = true
else 						isRunning = false

if (isRunning) chrome.runtime.sendMessage('Start: ' + localStorage.getItem("isRunning"))

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
	key = event.key;
	if (event.ctrlKey && key == 'F1') {
		isRunning = !isRunning
		localStorage.setItem("isRunning", isRunning);
		if (isRunning) chrome.runtime.sendMessage('Start:2')
		event.stopPropagation();
		event.preventDefault();
	}
	if (isRunning)  {
		if (['Control', 'Shift', 'Alt'].includes(event.key)) return;
		if (event.shiftKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Enter', 'Backspace', 'Delete', 'End', 'Home', 'Insert', 'ScrollLock', 'Tab', 'Pause'].includes(key)) key = 'Shift-' + key.trim()
		if(event.altKey) key = 'Alt-' + key
		if (event.ctrlKey) key = 'Ctrl-'+ key
		chrome.runtime.sendMessage('KEY:'+ key);
		event.stopPropagation();
		event.preventDefault();
	} 
};

function wlz_isRunning () {
	return isRunning 
}

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
/* 
      id: nodeId,
      tagName: element.tagName?.toLowerCase(),
      textContent: this.getCleanText(element),
      attributes: node.Role
      position: node.Rect,
      visibility: node.isVisible,
      children: node.Children,
      parent: node.Parent,
      depth: 0
 */
function wlz_extractTreeRag() {
	wlz_domScraper ()
	var treeRagArray = []
	console.log ('extractTreeRag')
	for (node of linearTree) {
		treeRagArray.push({Type: node.Role?node.Role:node.Click!=-1?'link':'', Id: node.Seq, TextContent: node.Label.replace(/\\n/g, '\n'), Children: node.Children.map(c=> c.Seq), Parent: node.Parent.Seq})
		console.log (JSON.stringify(treeRagArray.slice(-1)), '\n')
	}
	return treeRagArray
}

function udef0 (val) {
  if (typeof val == "undefined" || val == null) return 0
  else                           return val
}

/* 
	Helper function to deal with undefined numeric values
*/
function udefEmpty (val) {
  if (typeof val == "undefined" || val == null) return ''
  else                           return val
}

/* 
	Helper function to return the value of an attribute from a node in the cannonical dom
*/
function getAttribute (node, key) {
	attr = node.getAttribute (key);
	if (attr == null) attr = '';
	return attr;
}

/* 
   Return text for node, only if the node contributes visible text.  If all the text comes from children
   getText returns ''.   
   
   do not save hidden visibility or none display;  Some pages (Amazon product pages) have huge numbers of invisible nodes that 
   increase computation time to over 10 seconds
*/
function getText (element) {
	return Array.from(element.childNodes)
	  .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "")
	  .map(node => node.textContent)
	  .join("");	
/* 	if (node.childNodes.length == 0) return '';
	
	for (var i=0; i < node.childNodes.length; i++) 
//		log ('childNodes.tagName', udefEmpty(node.childNodes[i].tagName))
		if (node.childNodes[i].nodeType == 3 && !node.childNodes[i].parentNode.outerHTML.startsWith("<style>") && udefEmpty((node.childNodes[i]).nodeValue.trim()) != '')
			return udefEmpty(node.innerText).toString().replace(/\r?\n|\r/g, " ").trim();

	return ''; */
}
"26.1 - 40.0ft\n(2) Items\n (2)\n18.1 - 26.0ft\n(14) Items\n (14)\n13 - 18ft\n(12) Items\n (12)\nNot Specified\n(123) Items\n (123)"

/* 
	Creates the javascript datastructure for the cannonical dom from the actual dom.   The operations to 
	make the dom cannonical are on this datastructuer.
*/
function walkDom(node, level, parent) {
	var dom = copyNode (node, level, parent);
//	console.log ('|','.'.repeat(level), dom.Seq, dom.TagName, dom.Text);
	for (var i=0; i < node.children.length; i++) {
		var child = (node.children)[i];
		var style = window.getComputedStyle(child);
		if (!['NOSCRIPT', 'STYLE', 'SCRIPT'].includes(child.tagName))
			walkDom(child, level + 1, dom);
	};
	return dom;
}

/* 
	Extracts information from the actual Dom and creates properties in the cannonical dom.  This routine 
	creates an attribute Role that contains the meaning of a node regardless of how it is encoded.  For 
	example all nodes that show an image is given the 'image' role.  
*/
function copyNode (node,level, parent) {
  
	var style = window.getComputedStyle(node);
	var nuNode = createNode (parent);

	node.getAttributeNames().filter(name=> name.startsWith('wlz_')).forEach (attName => node.removeAttribute(attName))
	
nuNode.TextNodes = []
	nuNode.Node = node;
	nuNode.Seq = seq++;
	domNode[nuNode.Seq] = node;
	progNode[nuNode.Seq] = nuNode;
	nuNode.Time = Math.round(new Date()%(24*60*60*1000)/1000)
	if (!node.hasAttribute('wlz_time')) setAttribute (nuNode,'wlz_time', nuNode.Time)
////	else setAttribute (nuNode,'wlz_time', node.getAttribute('wlz_time')+','+nuNode.Time)
	setAttribute (nuNode,'wlz_seq', nuNode.Seq);
	setAttribute (nuNode, 'wlz_final', false);
	nuNode.Click = -1;
	nuNode.ClickURL = udefEmpty(node.getAttribute('onclick'))
	if (nuNode.ClickURL != '') nuNode.Click = nuNode.Seq
	nuNode.TagName = node.tagName.toUpperCase();
	nuNode.Id = node.id;
	nuNode.Opacity = style.getPropertyValue("opacity");
	nuNode.TabIndex = node.getAttribute("tabindex");
	if (nuNode.TabIndex == null) nuNode.TabIndex = 0;
	nuNode.Type = node.type;
	if (nuNode.Type == null) nuNode.Type = ''
	nuNode.AriaLive = node.getAttribute('aria-live');
//	nuNode.Id = node.id;
	nuNode.ClassList = udefEmpty(node.classList.toString().replace(/ +/g, ""));		//List of CSS classes
	let rect = node.getBoundingClientRect();
	nuNode.X = Math.round(rect.left + window.scrollX)
	nuNode.Y = Math.round(rect.top + window.scrollY)
	nuNode.W = udef0(node.offsetWidth);
	if (nuNode.W == 0 && node.scrollWidth != 'auto') nuNode.W = node.scrollWidth		// Fix problem with SVG width viewbox
	nuNode.H = udef0(node.offsetHeight);
	nuNode.X2 = nuNode.X + nuNode.W
	nuNode.Y2 = nuNode.Y + nuNode.H
	nuNode.Area = nuNode.H * nuNode.W;
	nuNode.Aspect = nuNode.W /nuNode.H;
	if (nuNode.H == 0 && node.scrollHeight != 'auto') nuNode.H = node.scrollHeight		// Fix problem with SVG height viewbox
	nuNode.LineHeight = style.getPropertyValue("line-height").replace('px','');
	nuNode.NumberLines = node.getClientRects().length
	nuNode.BaseLine = nuNode.Y + nuNode.H;
	nuNode.CenterX = nuNode.X + nuNode.W/2;
	nuNode.CenterY = nuNode.Y + nuNode.H/2;
	nuNode.Z = style.getPropertyValue("z-index")
	nuNode.Position = style.getPropertyValue("position");
	nuNode.FontSize = udef0(style.getPropertyValue("font-size"));
	nuNode.FontWeight = udef0(style.getPropertyValue("font-weight"));
	nuNode.FontStyle = style.getPropertyValue("font-style");
	nuNode.TextAlign = style.getPropertyValue("text-align");
	nuNode.Color = style.getPropertyValue("color");
	nuNode.Emphasis = udef0(10. * nuNode.FontSize.replace('px','') + nuNode.FontWeight/5.); 
	if (nuNode.Emphasis > maxEmphasis)  maxEmphasis = nuNode.Emphasis
	nuNode.BGcolor = style.getPropertyValue("background-color");
	if (['rgba(0, 0, 0, 0)','transparent'].includes(nuNode.BGcolor)) nuNode.BGcolor = '';
	nuNode.BGposition = udefEmpty(style.getPropertyValue("background-position"));  //Used to position icon in larger image
	nuNode.OrigBorder = style.border
	nuNode.Border = style.borderTop+';'+style.borderBottom+';'+style.borderLeft+''+style.borderRight;
	if ((nuNode.Border.match(/0px/g) || []).length == 4) nuNode.Border = ''
	nuNode.BGimage = udefEmpty(style.getPropertyValue("background-image"));
	if (nuNode.BGimage == 'none') nuNode.BGimage = '';
	nuNode.Display = style.getPropertyValue("display");
	nuNode.Visibility = style.visibility
	if (nuNode.Visibility == 'collapse') nuNode.Visibility = 'hidden'
	nuNode.Text = getText(node);
	nuNode.Label = ''
	nuNode.Description = '';
	nuNode.Value = '';
	nuNode.Href = udefEmpty(node.href);
	nuNode.Src = udefEmpty(node.src);
	nuNode.Alt = udefEmpty(node.alt);
	
	nuNode.AriaLabel = udefEmpty(node.getAttribute('aria-label'))
//	nuNode.AriaLabelledby = udefEmpty(node.getAttribute('aria-labelledby'))
//	nuNode.AriaDescribedby = udefEmpty(node.getAttribute('aria-describedby'))
//	nuNode.For = udefEmpty(node.getAttribute('for'))
//	nuNode.AriaControls = udefEmpty(node.getAttribute('aria-controls'))
	nuNode.Placeholder = udefEmpty(node.getAttribute('placeholder'))
	nuNode.DataPlaceholder = udefEmpty(node.getAttribute('data-placeholder'))
	nuNode.Title = udefEmpty(node.getAttribute('title'))
	nuNode.DataTooltip = udefEmpty(node.getAttribute('data-tooltip'))
	nuNode.DomValue = udefEmpty(node.getAttribute('value'))
	nuNode.hasAriaLive = node.hasAttribute('aria-live')
	nuNode.Role = '';
	nuNode.NCols = 1;
	nuNode.NRows = 1;
	nuNode.MainRoles = '';
//	nuNode.isNew = 0;
	nuNode.inNodeList = false;
	nuNode.IsInput = false;
	nuNode.Aria = false;
	nuNode.DeleteMe = false;
	nuNode.Deleted = false;
	nuNode.CommonLabel = false;
	nuNode.ProtoHeader = false;
	nuNode.GroupLevel = 0
	nuNode.ListCount = 1 //0
	nuNode.HeaderNode = null
	nuNode.HeaderDiv = null
	nuNode.RoleType = ''
	nuNode.ListType = ''
	nuNode.Groups = ''
	nuNode.Intersection = []
	nuNode.uiNodes = []
	nuNode.uiChildren = []
	nuNode.Pattern = []
	nuNode.RoleGroup = []
	nuNode.Links = []
	nuNode.HashKey = ''
	nuNode.MaxImageArea = 0
	nuNode.ErrMsg = ''
	nuNode.ParentsId = []
	nuNode.IsLabel = -1
	nuNode.ChildTags = ''
	nuNode.PrevSeq = nuNode.Seq

	if (nuNode.Node.hasAttribute('wlz_delete')) nuNode.Node.removeAttribute('wlz_delete')

		switch (nuNode.TagName) {
 		case 'P':
//			nuNode.Role = 'paragraph'
			break;
 		case 'A':
			nuNode.Click = nuNode.Seq;
			break;
		case 'BUTTON':
			nuNode.Click = nuNode.Seq;
			nuNode.Role = 'button';
			break;
//		case 'ARTICLE':
//			nuNode.Role = 'article';
//			break;
		case 'VIDEO':
		case 'SVG':
			let viewBox = node.getAttribute('viewBox')
			if (viewBox != null) {
				setAttribute (nuNode, 'wlz_box', viewBox);
				viewBox = viewBox.split(' ');
/* 				if (viewBox.length == 4) {						// Unreliable, CNN logo viewbox 240 when graphic is > 100
					nuNode.W = viewBox[2];
					nuNode.H = viewBox[3];
				} */
			}
			if (node.title != undefined) nuNode.Text = udefEmpty(node.alt);
//		case 'I':
		case 'IMG':
			if (node.alt != undefined) nuNode.Text = udefEmpty(node.alt);
			appearance = hashCode ('--');                                // WTF should h,w (+ ClassList)???
//			nuNode.ClassList + ',' + nuNode.H + '-' + nuNode.W;   // WTF ??????????
			nuNode.Role = 'image';
//			if (nuNode.H*nuNode.W == 0) log  ('IMG == 0', nuNode.Seq, nuNode.Src)
			break;
		case 'INPUT':
			switch (node.type) {
				case 'radio':		
				case 'checkbox':		
				case 'option':		
					nuNode.Value = node.checked;
					nuNode.Role = node.type;
					break;
				case 'submit':		
					nuNode.Role = node.type;  // 'button';  button is not isInput gets deleted
					break;
				case 'text':		
					nuNode.Value = node.value
					nuNode.Click = nuNode.Seq
					nuNode.Role = 'input';			// THIS WAS COMMENTED OUT, WHY Needed to set role in input text
				default:
					nuNode.Value = node.value
					nuNode.Click = nuNode.Seq
					nuNode.Role = 'input';			// ADDED, WHY Needed to set role in input text
					log ('input', nuNode.Seq, nuNode.Role)
			}
			break;
		case 'TEXTAREA':
			nuNode.Value = node.value
			nuNode.Role = 'input';
			break;
		case 'SELECT':
			if (node.options[node.selectedIndex] != null) 
				nuNode.Value = udefEmpty(node.options[node.selectedIndex].text);
			if (node.multiple) {
				nuNode.Role = 'multiselect';
			} else {
				nuNode.Role = 'select';
			}
			break;
		case 'OPTION':
			nuNode.Role = 'option';
			break;
		case 'Label':
			break;
		default:
//			nuNode.Role = nuNode.TagName.toLowerCase()
	}

	if (nuNode.Role == 'image')
		nuNode.Appearance = hashCode (nuNode.H+ ',' + nuNode.W)
	else
		nuNode.Appearance = hashCode (nuNode.FontSize+ ',' + nuNode.FontWeight+ ',' + nuNode.FontStyle+ ',' + nuNode.TextAlign+ ',' + nuNode.Color);

//	Remove node.children.length == 0 && nuNode.Text == ''  && 
	var role = node.getAttribute('role');
	switch (role) {
/*   		case 'alert':
			nuNode.Role = role;
			log ('Alert', nuNode.Seq, nuNode.Role);
			break;
		case 'article':
			nuNode.Role = role;
			break;
 */
		case 'button':
			nuNode.Role = 'button';
			break;
		case 'checkbox':
			nuNode.Role = role;
			break;
		case 'radio':
			nuNode.Role = role;
			break;
		case 'textbox':
			nuNode.Role = 'input';
			break;
		case 'listbox':
			nuNode.Role = 'select';
			break;
		case 'option':
			nuNode.Role = role;
			nuNode.Value = node.ariaSelected
//			getAttribute(node, 'aria-selected');   // WTF, Value should be on select
			break;
		case 'searchbox':
			nuNode.Role = 'input';			// Same as textbox
		case 'search':						// landmark, often applied to  <form>
			nuNode.Text = 'Search'
			break;
		case 'heading':
			break;
		case 'link':
			nuNode.Click = nuNode.Seq;
//			nuNode.Role = '';
			break;
		default:
	}
 
	if (nuNode.Role == 'button')
		nuNode.Click = nuNode.Seq;
	
	switch (nuNode.Role) {
 		case 'input':
 		case 'checkbox':
 		case 'radio':
 		case 'select':
 		case 'submit':
		case 'button':					// amazon product page, div has role of button in addition to text
		case 'option':
			nuNode.Click = nuNode.Seq;
			nuNode.IsInput = true;
			setAttribute (nuNode,'wlz_isinput', '');
			break;
		default:
			nuNode.IsInput = false;
	}

	nuNode.Margin = nuNode.X
	if (nuNode.TextAlign == 'right')
		nuNode.Margin = nuNode.X + nuNode.W
	if (nuNode.TextAlign == 'center')
		nuNode.Margin = nuNode.X + nuNode.W/2

	setAttribute (nuNode,'wlz_Role', nuNode.Role);
	setAttribute (nuNode,'wlz_final', false);
	
	if (nuNode.BGimage != '' && !nuNode.isInput) {
		nuNode.Src = nuNode.BGimage;
		nuNode.BGimage = '';
		nuNode.Role = 'image';
	} 

	nuNode.BaseClick = nuNode.Click
	nuNode.Grid = 0
	nuNode.GridElmt = 0

	return nuNode;
}

/* 
	Helper function to create each node in the javascript cannonical dom
*/
function createNode (parent, data) {
	var node = {Parent: parent, Children: []};
	if (parent != null) {
		parent.Children.push(node);
	}
	
	if (data != undefined) {
		for (var prop in data) {
			if (data.hasOwnProperty(prop)) {
				node[prop] = data[prop];
			}
		}
	}
//	setAttribute (node,'wlz_Text', node.Text);
	
	return node;
}

/* 
	debug function to print the cannonical dom on log
*/
function printTree (node, maxLevel, level = 0) {
	if (!(['alert', 'timer', 'log', 'status', 'progressbar', 'marquee', 'presentation'].includes (node.Role.toLowerCase())) && !node.Node.hasAttribute('aria-live') && node.Seq != 0)  
		totalText += node.TagName + node.Label
	setAttributes (node)
/* 	if (node.Parent != null) {
		let color = "white";
		color = wlzColors[level%22] ;
		node.Node.style.border = "2px dotted " + color
		if (node.Display == 'inline')			// WTF Some inline's will not show border
			node.Node.style.display = 'block';	// Can't reproduce in JSfiddle
		node.OrigBorder = "2px dotted " + color
	}
	setAttribute (node,'wlz_border', window.getComputedStyle(node.Node).border);
 */
	if (level < maxLevel) {
		if (node.Parent != null) {
logBlank('.'.repeat(level), node.Seq, node.Id, node.Role, node.Text, node.Label);
//log('.'.repeat(level), node.Seq, node.Click, node.Role, node.Description, '-', node.Value);
//			log('.'.repeat(level), node.Id, node.Seq, node.Click, node.Parent.Seq, node.Children.length, node.TagName, '(', node.X, node.Y, node.H, node.W, node.Area, node.Aspect,')', node.Emphasis, node.Role, '-', node.Label, '-', node.Value, '-', node.Src, '-', node.Href);
		} else {
			console.log('.'.repeat(level), node.Id, node.Seq, node.Click, null, node.Children.length, node.TagName, '(', node.X, node.Y, node.W, node.H, node.Area, node.Aspect,')', node.Emphasis, node.Role, '-', node.Description, '-', node.Value, '-', node.ClassList, '-', node.Href);
		}
	}
	for (var i=0; i < node.Children.length; i++) {
		printTree((node.Children)[i], maxLevel, level+1);
	}
}

function setAttributes (node) {
	if (node.Parent == null) return
//	setAttribute (node,'wlz_prevseq', node.PrevSeq);
	setAttribute (node,'wlz_id', node.Id);
	setAttribute (node,'wlz_parent', node.Parent.Seq);
	setAttribute (node,'wlz_bounds', (node.X) + ',' + (node.Y) + ','+ (node.W) + ','  + (node.H) + ','+ (node.Z));
	setAttribute (node,'wlz_area', node.W * node.H);
	setAttribute (node,'wlz_isVis', isVisible(node));
	setAttribute (node,'wlz_Role', node.Role);
//	setAttribute (node,'wlz_groups', node.Groups);
	setAttribute (node,'wlz_Label', node.Label);
//	if (node.IsLabel != -1) setAttribute (node,'wlz_islabel', node.IsLabel);
	setAttribute (node,'wlz_value', node.Value);
	setAttribute (node,'wlz_emphasis', node.Emphasis);
	setAttribute (node,'wlz_appearance', node.Appearance);
	setAttribute (node,'wlz_click', node.Click);
//	setAttribute (node,'wlz_clickurl', node.ClickURL);
	setAttribute (node,'wlz_classlist', node.ClassList);
	setAttribute (node,'wlz_text', node.Text);
	setAttribute (node,'wlz_chdrn', node.Children.map(c=> c.Seq).join());
	setAttribute (node,'wlz_lines', node.NumberLines)
//	setAttribute (node,'wlz_aria', node.Aria);
//	setAttribute (node,'wlz_opacity', node.Opacity);
//	setAttribute (node,'wlz_tabindex', node.TabIndex);
	setAttribute (node,'wlz_roletype', node.RoleType);
	setAttribute (node,'wlz_listtype', node.ListType);
//	if (node.HeaderNode != null) setAttribute (node,'wlz_header', node.HeaderNode.Seq);
//	if (node.HeaderDiv != null) setAttribute (node,'wlz_header_div', node.HeaderDiv.Seq);
//	setAttribute (node,'wlz_display', node.Display);
//	setAttribute (node,'wlz_visibility', node.Visibility);
	setAttribute (node,'wlz_leaves', node.Leaves);
	setAttribute (node,'wlz_input', node.IsInput);
//	setAttribute (node,'wlz_position', node.Position);
//	setAttribute (node,'wlz_ErrMsg', node.ErrMsg);
//	setAttribute (node,'wlz_textnodes', node.TextNodes);
	
//	if (node.Pattern != null && node.Pattern.length < 40)
//		setAttribute (node,'wlz_pattern', Array.from(node.Pattern).join(','));
//	setAttribute (node,'wlz_labcount', getTextHisto(node.Text));
//	setAttribute (node,'wlz_uichdrn', node.uiChildren.map(c=> c.Seq).join());
}

/* 
	Serialize the tree to transmit to the Python Human Interface
*/
function serializeTree (node, nodeList, lineList) {

	try {		
		lineList.push(nodeList.map(prop=> {if (prop in node) return node[prop]; else return ''}))
//		console.log ('serializeTree', lineList[lineList.length - 1])
	} catch(err) {
		log ('*...serializeTree', err.message, err.stack);
		log ('keys', Object.keys(node));
		return
	}
	for (child of node.Children) {
		serializeTree(child, nodeList, lineList);
	}
}

/* 
	Helper function to scan a tree or subtree of a node and return a list of nodes with specific
	properties and values
*/
function selectNodes (node, prop, values, results = []) {
	if (prop in node && values.includes (node[prop]))
		results.push(node); 
	for (var i=0; i < node.Children.length; i++) {
		results = selectNodes ((node.Children)[i], prop, values, results);
	}
	
	return results;
}

/* 
	Helper function to scan a list of nodes (not a tree) and return a list of nodes with specific
	properties and values
*/
function selectNodeList (nodeList, prop, values) {
	var results = []
	for (var i=0; i < nodeList.length; i++) {
		
		if (prop in nodeList[i] && values.includes (String(nodeList[i][prop])))  // list and elements must match
			results.push(nodeList[i]); 
	}
	
	return results;
}

function selectNodesFunct (nodeList, funct, results = []) {
	for (let node of nodeList) {
		if (funct(node)) {
			results.push(node); 
		}
		results = selectNodesFunct (node.Children, funct, results);
	}
	
	return results;
}

function findAnyFunct (nodeList, funct, results = false) {
	if (results) return true

	for (let node of nodeList) {
		if (funct(node)) return true; 

		results = findAnyFunct (node.Children, funct, results);
	}	
	return results;
}
/* 
	Helper function to return the first node in a tree with a specific attribute and value
*/
function selectNode (node, prop, value, result = null) {
	if (value == '') return null;
	
	if (result != null) {
		return result;
	}
	
	if (prop in node && node[prop] == value) {
		return node; 
	}
		
	for (var i=0; i < node.Children.length; i++) {
		result = selectNode ((node.Children)[i], prop, value, result);
		if (result != null) return result;
	}
	
	return null;
}

/* 
	Helper function to return a list of nodes with a specific parameter as an array of objects 
*/
function objectHisto (nodeList, param) {
	histo = {}
	for (var i=0; i < nodeList.length; i++){
		node = nodeList[i];
		if (!(node[param] in histo))
			histo[node[param]] = 1;
		else 
			histo[node[param]] = histo[node[param]] +1 ;
	}
	return histo
}

/* 
	Helper function to return a list of lists with a specific parameter as an array of objects 
*/

function listHisto (list) {
	histo = {}
	for (item of list){
		if (!(item in histo))
			histo[item] = 1;
		else 
			histo[item] = histo[item] +1 ;
	}
	return histo
}

function histogram (nodeList, param, tolorance = 0) {
	let histo = objectHisto (nodeList, param);
	let listLists = Object.entries(histo)
	if (nodeList.length == 0) return listLists
	
	if (tolorance == 0) return listLists.sort (function(a, b){return b[1]- a[1]})
		
	let sorted = listLists.sort (function(a, b){return b[0]- a[0]});
	let newHisto = [sorted[0]]
	for (let i=1; i<sorted.length; i++){
		if (Math.abs(sorted[i-1][0] - sorted[i][0]) > tolorance) {
			newHisto.push (sorted[i])
		} else {
			sorted[i][0] = sorted[i-1][0]
			sorted[i-1][1] += sorted[i][1]
		}
	}
	return newHisto.sort (function(a, b){return b[1]- a[1]});
}

/* 
	Helper function to scan a tree and return a flattened list of all visible nodes, eliminating 
	non-visible structure  
*/
												
function selectUiNodes (node, results = []) {
																			 
	if (isVisible(node)/*  && node.Role != 'text-link' */) {//WTF
					  
		results.push(node); 
	}

	for (var i=0; i < node.Children.length; i++) {
		results = selectUiNodes ((node.Children)[i], results);
	}
	
	return results
}

/* 
	Helper function to scan a list of nodes and return a list of visible nodes. 
*/
function selectUiNodeList (nodeList, results = []) {
	for (var i=0; i < nodeList.length; i++) {
		results = selectUiNodes (nodeList[i], results);
	}
	
	return results
}

/* 
	Helper function to get the actual coordinates of an element in the actual dom 
*/
function GetScreenCordinates(obj) {
	var p = {};
	p.x = obj.offsetLeft;
	p.y = obj.offsetTop;
	while (obj.offsetParent) {
		p.x = p.x + obj.offsetParent.offsetLeft;
		p.y = p.y + obj.offsetParent.offsetTop;
		if (obj == document.getElementsByTagName("body")[0]) {
			break;
		}
		else {
			obj = obj.offsetParent;
		}
	}
	return p;
}

/* 
	Traverse the cannonical dom tree (top down) to propagate the Href Emphasis in an enclosing node 
	down to its elements.   
*/
function fixSubNodeClicks (node) {
	if (node.Parent != null && node.Parent.Click != -1 && node.Click == -1) {
		node.Click = node.Parent.Click;
		node.ClickURL = node.Parent.ClickURL
		setAttribute (node,'wlz_click', node.Click);
	} 

//	if (node.Parent != null && node.Parent.TabIndex < 0)		// if parent invisible,  propogate to children
//		node.TabIndex = node.Parent.TabIndex;					// eBay shows descendants were meant to show
	
// whole foods filters headers get replaced
//	if (node.Parent != null && node.Parent.Emphasis >= 200 && node.Role != 'image' && !node.IsInput) {
//		node.Emphasis = node.Parent.Emphasis;
//	}

	for (var i=0; i < node.Children.length; i++) {
		var child = (node.Children)[i];
		fixSubNodeClicks (child);
	}
}

/* 
	Traverse the cannonical dom tree (bottom up) to ensure all containing divs are large enough
	to contain all their children
*/
function fixInherits (node) {
	for (let child of node.Children)  fixInherits (child)

	for (let child of node.Children) {
		if (node.Visibility=='hidden') child.Visibility = 'hidden'
		if (node.Display=='none') child.Display = 'none'
		if (isVisible(child) && child.Area > 0) {                             //WTF some nodes have zero area and one dimension
			node.H = Math.max (node.H, child.H);
			node.W = Math.max (node.W, child.W);
		}
	}
	node.Area = node.H * node.W;
	node.Aspect = node.W /node.H;
}
/* 
	Traverse the cannonical dom tree (bottom up) to attach a label to a node in the cannonical dom
	drawing on many sources, until a suitable label is found
*/
function fixAria (node) {
	for (var i=0; i < node.Children.length; i++) {
		fixAria (node.Children[i]);
	}

	log ('fixAria', node.Seq)
	if (node.Text == '') {
		if (node.Node.hasAttribute('aria-label')) {
			node.Text = node.Node.getAttribute('aria-label');
			log ('--aria-label', node.Label)
			node.Aria = true;
		}
		else if (node.Node.hasAttribute('aria-labelledby')) {
			let targetNode = document.getElementById(node.Node.getAttribute('aria-labelledby'))
			if (targetNode != null) node.Text = targetNode.textContent
			node.Aria = true;
	// 		let target = selectNode (root, 'Id', node.AriaLabelledby, null);
	//		if (target == null) return;
	//		log ('--AriaLabelledby', node.Seq, target.Seq, node.Label)
	//		combine (node, target, 'labeledby');
		}
		else if (node.Node.hasAttribute('aria-describedby') && node.Node.getAttribute('aria-describedby') != null) {
			let targetNode = document.getElementById(node.Node.getAttribute('aria-describedby'))
			if (targetNode != null) node.Text = targetNode.textContent
			node.Aria = true;
			log ('--describedby', node.Seq, document.getElementById(node.Node.getAttribute('aria-describedby')))
			
	// 		let target = selectNode (root, 'Id', node.Node.getAttribute('aria-describedby'));
	//		log ('--describedby', node.Seq, node.Node.getAttribute('aria-describedby'), target, node.Label)
	//		if (target == null) return;
	//		node.Aria = true;
	//		combine (node, target, 'describedby');
		}
	}
}	

function fixLabels (node) {
	for (var i=0; i < node.Children.length; i++) {
		fixLabels (node.Children[i]);
	}
		if (node.Node.hasAttribute('for')) {
		node.Text = node.Node.textContent
		let target = selectNode (root, 'Id', node.Node.getAttribute('for'), null);
		if (target == null || target.Seq == 0) return;        //WTF ???? looks like but in SelectNode that returns 0 when no id
		log ('--for', node.Seq, target.Seq, node.Label)
		node.Aria = true;
		combine (target, node, 'for');
	} 
	
//	else 
	if (node.Text != '') return
	
	if (node.Role == 'input' && node.Node.hasAttribute('placeholder')) {
		node.Text = node.Node.placeholder;
	}
	else if (node.Node.hasAttribute('data-placeholder')) {
		node.Text = node.Node.getAttribute('data-placeholder');
	}
	else if (node.Node.hasAttribute('title')) {
		node.Text = node.Node.title;
	}
	else if (node.Node.hasAttribute('data-tooltip')) {
		node.Text = node.Node.getAttribute('data-tooltip');
	}
	else if (node.Role == 'button' && node.Node.hasAttribute('value')) {  //WTF Aria not covered
		node.Text = node.Node.value;
	}
	else if ((node.TagName == 'CAPTION' || node.TagName == 'FIGCAPTION')) {
		node.Parent.Text = node.Label;
		deleteNode (node, 'fixLabels');
	}
//	if (node.Text == '') node.Text = node.Label
}


/* 
	Helper function copy the text from a header node to the label of an enclosing node and 
	delete the header node.
*/
function combine (node1, node2, msg) {
	getLabel(node1, node2)
	deleteNode (node2, 'Combine ' + msg + '_'+node1.Seq + '_'+node2.Seq);
}
	
function getLabel (node1, node2) {
													
	if (node2 == null) return
	if (node1 == null) {
		node1=node2;
//		deleteNode (node2, msg);
		return;
	}
	if (node1.Text == '' || !node1.Aria) {				//If node1 is blank or not Aria then copy node2 into node1
		node1.X = Math.min (node1.X, node2.X);          //WTF ... some leaves are 0,0 but do not show, yet visible??
		node1.Y = Math.min (node1.Y, node2.Y);
		node1.H = Math.max (node1.H, node2.H);
		node1.W = Math.max (node1.W, node2.W);
		node1.Appearance = node2.Appearance
		node1.Area = node1.H * node1.W;
		node1.Aspect = node1.W /node1.H;
		if (!node1.Aria){
	setAttribute (node1,'wlz_getLabel', '') 
			node1.Text = node2.Text
		}
	}
	if (!node1.IsInput) {
		node1.Click = node2.Click
//		node1.Role = 'header'
	}
//	setBorder (node2, "2px solid blue");
}
/* 
	Traverse the cannonical dom tree (bottom up) to scan for selects and look for options that have a zero
	height and width and set them to a small value so they are not deleted for not being visible
*/
function fixSelects (node) {
	node.Children.map(child => fixSelects (child));
	
	if (node.Role =='select' && isVisible(node)) {
		let options = selectNodes (node, 'Role', ['option'], []);
		setAttribute (node,'wlz_select','');
		options.forEach (option => {
			let uiNodes= selectUiNodes (option, []);
				option.H = 4;
				option.W = 4;
			deleteNodes (option, all);  // Delete children of options now that we have the label
		})
		node.Children = options; // Make sure options are the only children of select 
	}
	if (node.Children.length > 0)
		node.Emphasis = Math.max (...node.Children.map(c=> c.Emphasis))

}

// Checkbox and Radio, if children > 0 find longest label in children 
// if containing div is small, look at longest label from containing div and below -- WTF look at this again
function labelInputs (node) {
	
	log ('labelInputs START', node.Seq, ',', node.Role, ',', node.Label, node.Children.map(c=> c.Seq))
	if (['checkbox', 'radio', 'input'].includes(node.Role) && node.Label == '' ) {
		let input = node;
		let inputDiv = node;
/*
// fails with craigslist
		while (inputDiv.W*inputDiv.H < 500 && 
		  inputDiv.W*inputDiv.H > 4 && 			// Some branches have no area up to much higher in tree eg harborfreight
		  inputDiv.Parent != null
		  ) {	// parent cannot be null in call to moveNode
			log ('....', inputDiv.Parent)
			inputDiv = inputDiv.Parent;
		}
*/
		if (inputDiv.Parent == null || inputDiv.Parent.Parent == null)  log ('grandParent == null', input.Parent)
		inputDiv = inputDiv.Parent;
		while (inputDiv != null && inputDiv.Parent != null && inputDiv.Area < 500 
		  && (inputDiv.Parent.Area/inputDiv.Area < 2
		  )) {
			inputDiv = inputDiv.Parent;
		}

		log ('...', input.Seq, inputDiv.Seq, input.Label, inputDiv.Label)
		inputDiv.Text = udefEmpty(inputDiv.Node.innerText).toString().trim().replace(/\r?\n|\r/g, " ");
		if (inputDiv.Text == '') return
		inputDiv.Role	 = input.Role
		inputDiv.IsInput = input.IsInput
		inputDiv.Click	 = input.Seq
		inputDiv.Value	 = input.Value
		inputDiv.ChildTags = hashCode(walkTree(inputDiv, getHashTag).join(''))
//		console.log ('labelInputs', inputDiv.Seq, inputDiv.ChildTags)
		deleteNodes (inputDiv, all)
		
		log ('..', input.Seq, input.Label, '-', udefEmpty(inputDiv.Node.innerText).toString().trim().replace(/\r?\n|\r/g, " "))
		setAttribute (input,'wlz_labelinput', inputDiv.Seq);
	}
	node.Children.map(child => labelInputs (child)); 
}

/* 
	Traverse the cannonical dom tree (top down) to find fieldset nodes, then the corresponding legend
	node and copy the legend text into the label of the fieldset node and delete the legend.
	Fieldset is just another way to create a label for a group of nodes.
*/
function fixFieldSet (node) {
	if (node.TagName == 'FIELDSET') {
		var legend = selectNode (node, 'TagName', 'LEGEND', null);
		if (legend != null) {
			node.Label = legend.Node.textContent.trim();
			deleteNodes (legend, all);
			setAttribute (node,'wlz_fixFieldSet', '');
		}
	}
	node.Children.map(child => fixFieldSet (child));
}

/* 
	Traverse the cannonical dom tree (top down) to eliminate duplicate labels in a list of nodes
*/
/* function fixDuplicates (node, uiNodes) {
	log ('fixDuplicates',node.Seq, uiNodes.length)
	if (uiNodes.length == 0) return
	
	dupHisto = histogram (uiNodes, 'Label').filter(c=> c[1] > 1)
	log ('---', node.Seq, dupHisto)
	if (dupHisto.length == 0) return
	for (dups of dupHisto) {
		dupNodes = uiNodes.filter(c=> c.Children.Length == 0 && c.Label == dups[0]).sort((a,b) => a.Emphasis - b.Emphasis)
		log ('-- dupNodes', dupNodes)
		for (let i=1; i<dupNodes.length; i++) {
			log ('--duplicate', dupNodes[i].Seq, dupNodes[i].Label)
			deleteNode(dupNodes[i], 'duplicate')
		}
	}
	return 
} */

/* 
	Traverse the cannonical dom tree (top down) to change text nodes to currency or number as appropriate
	Also change image nodes to icon if the area is less than 4k and the aspect ratio is less than 2
	Also change image nodes to Button if area is less than 15k with aspect ration >= 2 and clickable
	Also set Emphasis of image nodes that have alt text and area > 10k to 260
	
*/
function fixLeaves (node) {
	if (node.Text.replace(',','').search(/^\$[\s0-9\.,]+$/) == 0) {
		node.Role = 'currency';  // ???????
	}
	else if (node.Text.replace(',','').search(/\d+¢/) == 0) node.Role = 'currency'; 
//	else if (node.Text != '' && !isNaN(node.Text)) node.Role = 'number';
	
	else if (node.Role == 'image') {
		if (node.Area < 4000 && node.W / node.H < 2) {
			if (node.Click == -1)
				node.Role = 'icon';
			else {
//log ('Img2Button', node.Seq, node.Area, node.W / node.H, node.Label)
				node.Role = 'button'
			}
		} else if (node.Area < 15000 && node.W / node.H >= 2 && node.Click != -1) {
//log ('Img2Button 2', node.Seq, node.Area, node.W / node.H, node.Label)
			node.Role = 'button';
		} else if (node.Label != '') {
			node.Emphasis = 250;
		}
	}
	node.Children.map(child => count = fixLeaves(child));
	return;
}


//nodes = [{X: 344, Y: 194, H: 60, W: 224}, {X: 516, Y: 194, H: 60, W: 60}]
//nodes = [{X: 6, Y: 111, H: 27, W: 212}, {X: 22, Y: 1851, H: 18, W: 159}]
//nodes = [{X: 16, Y: 763, H: 25, W: 185}, {X:1, Y: 802, H: 32, W: 110}]

/* 
	Helper function to test if nodes in a collection are a single row 
*/
/* function computeNRowsNCols (node) {
	let xHist = histogram (node.Children, 'X', 2);
	let yHist = histogram (node.Children, 'Y', 2);
	node.NRows = yHist.length
	node.NCols = xHist.length
	log ('computeNRowsNCols', node.Seq, node.Label, node.NRows, node.NCols)
	
	node.Children.map(child => computeNRowsNCols(child));
}

function isRow (node) {
//	log ('isRow', node.Seq, node.Label, node.NRows, node.NCols)
	if (node.NRows == 1 && node.NCols > 1) return true
	return false
}

function isColumn (node) {
//	log ('isColumn', node.Seq, node.Label, node.NRows, node.NCols)
	if (node.NCols == 1 && node.NRows > 1) return true
	return false
}

function isGrid (node) {
//	log ('isGrid', node.Seq, node.Label, node.NRows, node.NCols)
	if (xHist.length >= 2 && yHist.length >= 2
	  && node.Children.length > Math.max(xHist.length, yHist.length))
		return true
	return false
}
 */
/* 
	Traverse the cannonical dom tree (bottom up) to;
	1)	Compute the number of visible leaves in a subtree
	2)	Add a property (uiNodes) to each element that contains an array of the visible elements
		in a subtree including the top node
	3)	Add a property (uiChildren) that is uiNodes without the top node
	4)	Compute a Pattern property as a string of concatenated of strings Role + Appearance for each node
*/

function addPatternsLeaves (node, level=0) {
	node.Children.map (child => addPatternsLeaves (child, level + 1));
	log ('addPatternsLeaves START', node.Seq, node.Children.length)
	node.Children = sortList (node.Children);
	if (isVisible(node) && node.Role != 'option' && (node.Text != '' || node.IsInput)) {
		node.Leaves = 1;
	} else {
		node.Leaves = 0;
	}

	node.uiNodes = [node];
	let histo = {}
	if (node.Children.length > 0) {	
		for (child of node.Children) {
			node.Leaves = node.Leaves + child.Leaves;
			node.uiNodes = (node.uiNodes).concat(child.uiNodes);
			for (element of child.Intersection) {
				if (!(element in histo))
					histo[element] = 1;
				else 
					histo[element] = histo[element] +1 ;
			}
		}
		let sortedList = Object.entries(histo).sort (function(a, b){return b[1]- a[1]});
		node.Intersection = sortedList.filter (e=> e[1] >= sortedList[0][1]-2).map(e=> e[0])
		if (sortedList[0][1] > 3)
		log ('intersection' , node.Seq, node.Parent.Seq, node.Label, ' - ', sortedList.map (e=> e[1]), '=>', node.Intersection.join())
		
		if (node.uiNodes.length > 0) 
			node.Emphasis = Math.max (...node.uiNodes.map(c=> c.Emphasis))
		
//		if (node.Role == '') node.Role = 'list'
	} else
		node.Intersection = [node.Role + node.Appearance]
	
	node.uiNodes = node.uiNodes.filter (c=> isVisible(c)/*  && c.Role != 'text-link' */)
	node.uiChildren = node.uiNodes.filter (c=> c.Seq != node.Seq && c.Role != 'option')

	log ('addPatternsLeaves', node.Seq, node.uiNodes.map(c=> c.Seq), node.uiChildren.map(c=> c.Seq))

	node.Pattern = new Set(node.uiNodes.map (c=> c.Role + c.Appearance))

	node.RoleGroup = node.Role + node.Appearance;
//	if (node.Children.length == 0 && !(node.Pattern in patternContent)) {
//		patternContent[node.Pattern] = {Emphasis:node.Emphasis}
//	}
	if (node.Role == 'image')
		node.MaxImageArea = node.Area
	else
		if (node.Children.length > 0) 
			node.MaxImageArea = Math.max(...node.Children.map(n => n.MaxImageArea))
		else
			node.MaxImageArea = 0
//	logBlank('MaxImageArea', node.Seq, node.Area-node.MaxImageArea, node.Text, node.Label)
//		log ('pattern/roleGroup/content', node.Seq, node.Parent.Seq, node.Pattern, node.RoleGroup, patternContent[node.Pattern])
	nodeById = {}
//	/* if (node.Children.length == 0) */ testId(node)
	nodeById = {}
}

function testId (node) {
	if (node.Id == '') {
		node.Hash = node.TagName +node.ClassList +node.Text +node.Href +node.ClickURL +node.Position +node.FontSize +node.FontWeight +node.FontStyle +node.TextAlign +node.Color +node.BGcolor +node.BGposition +node.Border +node.BGimage +node.Text +node.Href +node.Src 
		
		node.Node.getAttributeNames().filter(name=> !name.startsWith('wlz_')).forEach (attName => node.Hash +=  attName+'='+node.Node.getAttribute(attName))

		node.HashTag = hashCode (node.Hash)
log ('testId', node.Seq, node.Hash, node.HashTag)
		if (node.HashTag in nodeById) {
			log ('testId collision', node.Seq, nodeById[node.HashTag].Seq, node.Text, node.Hash)
			nodeById[node.HashTag] = node
//			nodeById[node.HashTag].Id = ''  // set Id = ''
		} else {
//			node.Id = node.HashTag
			nodeById[node.HashTag] = node
		}
	} else
		nodeById[node.Id] = node
}

/* 	Helper function to test whether a node is visible
*/
/* function isLeaves (node) {
	if (node.Children.length > 0) return false
	return isVisible(node)
}
 */
function isVisible (node) {
//	if (isElementObscured (node.Node)) setAttribute (node,'wlz_covered')
	
	return !((node.X + node.W) < 0 
		|| (node.Y + node.H) < 0 
		|| node.X > root.X + root.W
		|| node.W * node.H <=4
		|| !node.Node.checkVisibility()
		|| node.Visibility == 'hidden'
		|| node.Opacity == 0	
//		|| isElementObscured (node.Node)
//		|| node.AriaLive
//		|| (node.IsInput || node.Text != '' || node.Label != '')
//		|| (node.Children.length == 0 && node.Text == '' && !node.IsInput)
		)
}
function isElementObscured(element) {
	const rect = element.getBoundingClientRect();
	const centerX = (rect.left + rect.right) / 2;
	const centerY = (rect.top + rect.bottom) / 2;
	return document.elementFromPoint(centerX, centerY) !== element;
}
/* 
function isCoveredUp (node) {
	if (node.Children.length > 0) return false
	let topElement = document.elementFromPoint (node.X + node.W/2, node.Y + node.H/2)
	if (topElement == null) return true
	if (topElement.getAttribute('wlz_seq') != node.Seq) setAttribute (node,'wlz_coverup', topElement!=null)

	else return topElement.getAttribute('wlz_seq') != node.Seq
}
 */
/* 
	Helper function used with deleteNode to specify nodes that are visible
	usage => deleteNodes (root, redundant) will delete all nodes that have only one child and 
	is not an input node.
	If the node to be deleted has a label and the child does not the label and Role are copied to 
	child (there is only one) node (so information is not lost)
*/
function redundant (node) {   // Bottom up 
	if (node.Children.length != 1 ) return false;
/*  || node.IsInput */
	if (!node.Children[0].Text.includes(node.Text.trim()))
		node.Children[0].Text = (node.Children[0].Text + ' '+node.Text).trim()
	if (!node.Children[0].Label.includes(node.Label.trim()))
		node.Children[0].Label = (node.Children[0].Label + ' '+node.Label).trim()
	if (node.Children[0].Role == '' &&  node.Role != '')  
		node.Children[0].Role = node.Role
	node.Children[0].Emphasis = Math.max (node.Emphasis, node.Children[0].Emphasis)
	if (!node.Children[0].IsInput) node.Children[0].IsInput = node.IsInput
	
	if (node.Children[0].Position == 'static')
		node.Children[0].Position = node.Position
	if (node.Children[0].Display != 'inline') {
		node.Children[0].X = node.X
		node.Children[0].W = node.W
	}
	return true
}

/* 
	Helper function used with deleteNode to delete all nodes in a subtree
*/
function all (node) {
	return true;
}

/* 
	Helper function used with deleteNode to flatten a subtree removing all containers
*/
function flatten (node) {
//	return node.Children.length > 0 && !node.IsInput && node.Role != 'pagechooser'
//	return !isVisible(node);
	return node.Text.trim() == ''
}

/* 
	Helper function used with deleteNode to delete all nodes with near zero area (<4) or
	display = none or type is hidden.  Also deletes node with 'aria-live' 
*/
function hiddenOrZero (node) { // don't delete option even if it is hidden.
/* if (!isVisible (node))
	console.log ('Invisible', node.Seq
		, (node.X + node.W) < 0 
		, (node.Y + node.H) < 0 
		, node.X > root.X + root.W
		, node.W * node.H <=4
		, node.Display == 'none' 
		, node.Type == 'hidden'
//		, node.AriaLive
		, (node.Opacity == 0 && !node.IsInput)	
//		, (node.IsInput || node.Text != '' || node.Label != '')
//		, (node.Children.length == 0 && node.Text == '' && !node.IsInput)
		) */


	return !isVisible (node)
	
/* 	(node.W * node.H <4 
	  || node.Display == 'none' 
	  || node.Type == 'hidden' 
	  || (node.Opacity == 0 && !node.IsInput)
	  || (node.Children.length == 0 && node.Text == '' && !node.IsInput)
	  ); */
}


function blankLabel (node) {
	return !(node.Label.replace(/[^\w\s]|_/g, "") != '' || (node.Role != '' && node.Children.length != 0)) 
//|| (node.isInput && node.Label.trim() == '');
	
//L!='' || (R!='' && C!=0) || (I && L='')
	
}


function deleteNodes (node, test, caller) {    // Don't delete the top node
	if (arguments.length ==  2) caller = arguments.callee.caller.name
	node.Children.map(child => deleteNodes (child, test, caller));	
	for (let i=0; i<10; i++) {
		let count = 0
		for (child of node.Children) {
			if (node.Parent != null && test(child)) {
				child.DeleteMe = true;
				deleteNode (child, test.name +'-'+ caller +'-'+ node.Seq)
				count++
			}
		}
		if (count == 0) {
//			if (i > 0)
//				log  ('deleteNodes repeat', i, test.name +'-'+ caller +'-'+ node.Seq)
			return
		}
	}
	console.log ('deleteNodes some deletes failed', test.name +'-'+ caller +'-'+ node.Seq)
//	testDelete (root, 'deleteNodes')
}

/*--------------------------------------------------------------------
Deletes bottom up
----------------------------------------------------------------------*/
/* 
	Helper function for deleteNodes, removes a node from a tree, leaving the nodes above and 
	below intact
*/
function deleteNode (node, msg) {
	if (node.Parent == null) return;
//		console.log ('deleteNode', node.Seq, node.Parent, node.Children.length)
	setAttributes (node)
	if (node.Parent.Children.length == 0) console.log ('node.Parent.Children.length == 0');
	
	if (node.Deleted) {
		console.log ('deleteNode Duplicate', node.Seq, node.Deleted,  msg);
		return;
	}
	let index = node.Parent.Children.map(c=> c.Seq).indexOf(node.Seq);
	if (index == -1)
		console.log ('deleteNode failed', msg, node.Parent.Seq, index, node.Parent.Children.map(c=> c.Seq)) 
	else {
//		if (node.DeleteMsg == null) console.log ('*... Delete wrong node', node.Seq)
//		setAttribute (node,'wlz_delete')
		setAttribute (node,'wlz_delete', msg)
		node.Deleted = true;
		node.Children.map(child=> child.Parent = node.Parent);
		if (!node.Parent.Children.some(c=> c.Seq == node.Seq))
			console.log('*... Parent before delete', node.Seq, node.Parent.Seq) 
		parentChildren = node.Parent.Children.map(c=> c.Seq)
		node.Parent.Children.splice(index, 1);
		if (testNode (root, node, 'deleteNode', false)) 
			console.log ('.', node.Parent.Seq, index, '->', parentChildren)
		node.Parent.Children = node.Parent.Children.concat(node.Children);
		if (node.Parent.Children.some(c=> c.Seq == node.Seq))
			console.log('*... Parent didnt delete', node.Seq, node.Parent.Seq) 
		node.Children = [];
		node.Parent = null
		return
	} 
}

/* 
	Sorts a list of children of a node in x and y
*/
function sortList (nodeList) {
 	if (nodeList.length > 0) {
		if (nodeList[0].Parent != null && nodeList[0].Parent.ListType=='column') {
			nodeList.sort (function(a, b){return a.Y - b.Y});
		} else  {
			nodeList.sort (function(a, b){return a.Seq - b.Seq});
		}
	}
	return nodeList
}

/* 
	Traverse the cannonical dom tree (bottom up) to sort all the children in a tree
	in x and y
*/
function sortChildren (node) {
	sortList (node.Children);
	node.Children.map(child => sortChildren (child));
}

/* 
	Traverse the cannonical dom tree (top down) to find elements with tag or role of 'article'
*/
/* function findArticles (node) {
	if (node.Role == 'article') {
		setAttribute (node,'wlz_article', '');
		fixDivLabel (node);
		node.Article = true;
	}
	
	node.Children.map(node => findArticles (node));
}
 */
/* 
	T.B.D.
*/

/*---------------------------------------------------------------
Bottom up, 
Set all branches to false, when you recognize the target, set branch 
to done, don't process done branches
find index of node in current siblings
Find clicks as number of unique hrefs
clicks > 3 && node.Y < screenH/4 && node.W > screenW/2 && node.H < 100  && clicks > node.Leaves*0.6
----------------------------------------------------------------*/
function findMenuBar (node) {
	node.Children.forEach(child => findMenuBar (child))
	
	let numClicks = node.uiChildren.filter(n=> n.Click != -1).length
//	log ('findMenuBar', node.Seq, node.Children.every(n=> n.Role != 'menubar'), numClicks, node.uiChildren.length, node.W, screenW*.9)
//	log ('..findMenuBar', node.uiChildren.filter(n=> n.Click != -1).map(n=> n.Text))
	if (node.W > screenW*.9 && node.H < 200 && node.Y < 300 && node.Children.every(n=> n.Role != 'menubar') && numClicks > 3 && numClicks > node.uiChildren.length * .5) {
//		node.Label = 'menubar'
		node.Role = 'menubar'
		node.RoleType = 'list'
		deleteNodes(node, flatten)
		log ('findMenuBar', node.Seq, node.Role)
	} 
}

function labeledPicture (node) {
	node.BranchDone = false
	node.Children.forEach(child => labeledPicture (child))
	
	if (node.Parent != null && node.BranchDone)
		node.Parent.BranchDone = node.BranchDone

	if (!node.BranchDone) {
		
		var roleHisto = objectHisto (node.uiChildren, 'Role')
		if (node.uiChildren.length > 1) 
/* 		log ('labeledPicture', node.Seq, node.uiChildren.length > 1, 'image' in roleHisto
		  , (node.uiChildren[0].Role == 'image' ||  node.uiChildren.slice(-1)[0].Role  == 'image')
		  , roleHisto['image'] == 1
		  , node.W < screenW/2
		  , node.Leaves < 50) */
		if (node.uiChildren.length > 1 && 'image' in roleHisto
		  && roleHisto['image'] == 1
		  && (node.uiChildren[0].Role == 'image' || node.uiChildren.slice(-1)[0].Role == 'image')
		  && node.W < screenW/2
		  && node.Leaves < 50
		) {
			let picture = node.uiChildren.filter(n=> n.Role=='image').sort((a,b) => b.Area - a.Area)[0]
//			log ('labeledPicture', picture.Seq, picture.Y, (picture.Y+picture.H))
//			log ('..',node.uiChildren.filter(n=> overlap(picture,n)).map(n=> n.Seq +','+ n.Y +','+ (n.Y+n.H) + ' - '))
			let label = node.uiChildren.filter(n=> !overlap(picture,n)).map(n=> n.Text).sort((a,b) => b.length - a.length)
			if (label.length == 0 || label[0].trim().length == 0) return
//			log ('...', node.Seq, '"'+node.Label.trim()+'"', label[0])
			if (node.Label.trim() == '') {		//Replace multiples
//				log ('..')
				setList (node, 'labeledPicture','wlz_labeledPix')
				node.Label = label[0]
				deleteNodes(node, flatten)
				node.BranchDone = true
			}
		}
	}
}

function overlap(rectA, rectB) {
	return rectA.X < rectB.X2 && rectA.X2 > rectB.X 
			&&
			rectA.Y > rectB.Y2 && rectA.Y2 < rectB.Y
}

function findPageChooser (node) {
	node.BranchDone = false
	node.Children.forEach(child => findPageChooser (child))
	
	if (node.Parent != null && node.BranchDone)
		node.Parent.BranchDone = node.BranchDone
	
	sortList (node.Children);
	if (!node.BranchDone && node.Children.length > 5 
	&& node.Children.length < 15 && node.H > 20	&& node.ListType=='row' 
	&& selectNodes (node, 'Role', ['number'], []).length >= node.Children.length -3 ) {
		setList (node,'pagechooser' ,'wlz_pageChooser')
		node.BranchDone = true;
	}
}


/* function isPageChooser (node) {
	sortList (node.Children);
	if (node.RoleType == 'list' && node.Children.length > 5 
	&& node.Children.length < 15 && node.H > 20 && node.H < 100
																			 
	&& node.ListType=='row'
	&& selectNodes (node, 'Role', ['number'], []).length >= node.Children.length -3 
																			 
	 
	) {
								  
		node.Role = 'pageChooser';
		return true;
	}
	return false;
}
 */

function incl (string, test) {
	if (string=='') return false
	string = string.replace(/[^ -~]+/g, "")

	for (t of test.split(',')) {if (string.toLowerCase().includes((t))) return true}
//-	return clog(true, string.slice(0,10), t)}
	return (false)
}

function chldrn (node, funct) {
	let result=0
	if (node.Children.length == 0) return result
	for (let n of node.Children) {
		if (funct(n)) {
		result = result + 1}
	}
	return result
}

function every (node, funct) {
	return node.Children.every(n=> funct(n))
}

function same (node, prop) { //, tol=0) {
	return node.Children.length > 2 && node.Children.every ((n,i,a)=> n[prop] == a[0][prop])
//	return eval ("Math.max(...node.Children.map(c => c.'+ prop +') - Math.min(...node.Children.map(c => c.'+ prop +') < tol")
}

//*... roleDef[0].replace is not a function TypeError: roleDef[0].replace is not a function at chrome-extension://njamdneagmaofmfnbbjagicgplfpffhn/content.js:1708:81
//typeof roleDef[0] string add to foobar
function computeRoles (node) {
	let nodeList = ''
	for (let roleDef of roleDefs) {
//-		console.log ('---------------------------------------------------------')
		var nodesVisited = []
		if ((typeof roleDef[0]) === 'function') {
			nodeList = selectTree (node, roleDef[0])
		} else {
			nodeList = selectTree (node, (n=> incl(n.Label,roleDef[0]) && getTextHisto(n.Text) <= 2))
//			let temp = roleDef[0].replace(/\s/g, "") // fixed error by moving out
//			roleDef[0] = (n=> incl(n.Label,roleDef[0])/*  || incl(n.ClassList, temp) */)
		}
		
//		let nodeList = selectTree (node, roleDef[0])
		var newNodeList = []
//		console.log ('nodeList ', nodeList.map(n=> n.Seq))
		nodeList = nodeList.filter(n=> !nodesVisited.includes(n.Seq))
//		console.log ('nodeList2', nodeList.map(n=> n.Seq))
		nodesVisited = nodesVisited.concat(nodeList.map(n=> n.Seq))
		for (let n of nodeList) {
			if ((typeof roleDef[1]) === 'function') {
				roleDef[1] (n) 
			} else if (roleDef[1].startsWith('+')) {
				if (n.Label == '') n.Label = ' '
				n.Groups = n.Groups + ',' + roleDef[1].slice(1)
				setAttribute (n,'wlz_group', n.Groups);
				log ('..', n.Seq, n.Groups, n.Label)
			} else if (roleDef[1].startsWith('*')) {
//-				console.log ('push', n.Seq, n.Label.slice(0,10))
				newNodeList.push(n)
				if (n == null) console.log ('n == null')
			} else {
				if (n.Role == '') n.Role = roleDef[1]
				setAttribute (n,'wlz_role', n.Role);
			}
		}

		if (newNodeList.length > 0) {
			if (roleDef.length > 2) {
				console.log ('newNodeList0', newNodeList)
				specialNodes = specialNodes.concat(roleDef[2](newNodeList).Seq)
			} else {
				console.log ('newNodeList1', newNodeList)
				specialNodes = specialNodes.concat(newNodeList.map(n=> n.Seq))
			}
			if (specialNodes.length >0 && specialNodes.slice(-1)[0] != 0)
				specialNodes.push(0)
		}
	}
}

roleDefs = [
[(n=> chldrn(n, (n=>incl(n.Role, 'image')))>0 && chldrn(n, (n=>incl(n.Role, 'currency')))>0), "product"],
[(n=> n.Leaves > 5 && n.Leaves < 200 /* && n.H > 100 */ && n.H < 750 && n.ListType=='row' && incl(n.ClassList,'carousel') ), 'carousel'],
//[n=> n.Click != -1 && !n.IsInput &&  !["image"/* ,"text-link" */].includes(n.Role), 'link'],

[(n=> n.Role == '' && (n.Parent.Role=='' && n.Parent.Leaves-n.Leaves<3) && same(n, 'TagName') && (
			same(n, 'Area')
		 || (same(n, 'W') /* && n.ListType=='column' */)
		 || (same(n, 'Y') /* && n.ListType=='row' */)
		 || (n.RoleType=='grid')
	)
	), ' '], 

[(n=> same(n, 'TagName') && (
			same(n, 'Area')
		 || (same(n, 'W') /* && n.ListType=='column' */)
		 || (same(n, 'Y') /* && n.ListType=='row' */)
		 || (n.RoleType=='grid')
	)
	),(n=> n.Children.filter(c=> c.Role=='' && c.Children.length>1).forEach(c=> c.Role='item'))], 

/* [n=> n.Children.length>=2 && n.Children.filter(c=> c.Leaves > 2).length==1, (n=> n.Children.filter(c=> c.Leaves > 2)[0].Role='deleteme')], */

[n=> (n.FontWeight>699||n.Emphasis>300) && n.Text!='' && n.Seq != 0 
//node.Children.reduce((total,p) => (p.Label != '')?total+1:total,0) == 0 && 
 , '+header'],

//(|| chldrn(n, (n=>incl(n.ClassList,'carousel')))>0)
//[n=> n.Seq != 0 && n.Leaves>5 && Math.max (...n.Children.filter(c=> c.Role!='image').map(child => child.Area)) < 350000, '+specialnode']
// search, contact, products, price,  

[(n=> n.Role=='input' && ( incl(n.Label,'search') || incl(n.ClassList,'search'))), '*'],
//overview,about,description,Specifications,features,details
//[(n=> n.TagName=='UL' && n.Aspect < 1. && clog(n.Seq)!=-1 && clog(n.Children.length)>0)

[(n=> n.Seq==0), '*'],
[(n=> incl(n.Label,'overview,about,description,specifications,features,details')), '*'],//, (nList=> nList[0].Children.map(c=> c.Label).join(','))], 
//[(n=> n.Text.length > 10 && n.Emphasis > 250 && n.Y < screenH/3), '*', (nList=> nList.reduce((prev, current)=>  (prev && ((prev.Emphasis/maxEmphasis+1-(prev.Y/screenH)) > (current.Emphasis/maxEmphasis+1-(current.Y/screenH))))? prev : current))],
[(n=> /(\$\s?\d+(\.\d{2})?)|(USD\s?\d+(\.\d{2})?)/.test(n.Label)), '*', (nList=> nList.reduce((prev, current)=>  (prev && ((prev.Emphasis/maxEmphasis+1-(prev.Y/screenH)) > (current.Emphasis/maxEmphasis+1-(current.Y/screenH))))? prev : current))],
['cart', '*'],
//['add to', '*'],
['buy', '*'],
['shop now', '*'],
['bid', '*'],
['view deal', '*'],
['continue shopping', '*'],
['log in,login,sign in', '*'],
]

/* function similarChildren (node) {
	node.Children.forEach((child) => similarChildren (child));
	
	if (same(node, 'TagName')
		&& (same(node, 'Area')
		 || (same(node, 'W') && node.RoleType=='column')
		 || (node.RoleType=='grid' || node.RoleType=='group'))) {
			if (node.Label == '') node.Label = ' '
			node.Role = 'similar'
//			setAttribute (node,'wlz_role', 'similar');
//			log ('similar', node.Seq, node.Role, node.Label)
		 }	
} */

function tesselatePage (node) {
	let largeChildren = node.Children.filter(n=> n.Area - n.MaxImageArea >= 300000).length
	let smallChildren = node.Children.filter(n=> n.Area < 30000).length
//	if (largeChildren > 0) log ('largeChildren', node.Seq, largeChildren, node.Children.map(n=> n.MaxImageArea))
//	let similar = 0

	if (node.Seq != 0 && node.Area < 2000000 &&
	  (node.Children.length == 0  
	  || (node.Area < 1200000 && node.Label != '')
	  || largeChildren == 0
	  || smallChildren > node.Children.length * .7
	)) {
//		node.Node.style.border =  "3px solid gray"
		node.Groups += ',tesselate'
		setAttribute (node, 'wlz_tess', '')
		tesselate.push(node)
		return 
	} else {
//		if (node.Seq != 0) deleteNode(node, 'tesselatePage')
		setAttribute (node, 'wlz_deltess', '')
		setAttributes (root)
	}
	node.Children.map(child => tesselatePage (child));
}

/* function tesselatePage1 (node) {
	tesselate = tesselatePage2 (node.Children, 300000)
}

function tesselatePage2 (nodeList, childMax, tesselate=[]) {

	for (node of nodeList) {
		let largeChildren = node.Children.filter(n=> n.Area - n.MaxImageArea >= childMax).length
		if (node.Seq != 0 && (node.Children.length == 0  
		  || (largeChildren == 0)
		)) {
			console.log ('tess2', node.Seq, largeChildren, node.Children.length)
			node.Node.style.border =  "3px solid gray"
			node.Groups += ',tesselate'
			setAttribute (node, 'wlz_tess', '')
			tesselate.push(node)
			return tesselate
		} else {
			console.log ('tess2 delete', node.Seq, largeChildren, node.Children.length)
//			deleteNode (node, 'tess')
		}
		node.Children.map(child => tesselate = tesselatePage2 (child.Children, childMax, tesselate));
	}
	return tesselate
} */


/* 
	Aria can move an element to be a child of another
	https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-owns
*/
/* function ariaOwns (node) {
	if (node.Node.hasAttribute('aria-owns')) {
		let target = selectNode (root, 'Id', node.Node.getAttribute('aria-owns', null));
//		log ('ariaOwns', node.Seq, target.Parent.Children.length)
		if (target == null) return;
		setAttribute (node,'wlz_ariaowns_t', target.Seq)
		setAttribute (target,'wlz_ariaowns_s', node.Seq)
		moveNode (target, node)
	}
}
 */
/*
	Moves a node to a different place in the dom
*/
function moveNode (node, dest) {

	node.Parent.Children = node.Parent.Children.filter (n=> n.Seq != node.Seq);
	node.Parent = dest;
	dest.Children.push(node);
	sortList (dest.Children)
	setAttribute (node,'wlz_moveNode', node.Seq+'-'+dest.Seq)
}

function buildDescriptions (node) {
	node.Children.forEach((child) => buildDescriptions (child));
try {	
	sortList (node.Children)
//	let cmp = (a, b) => (a > b) - (a < b)
	let childrenSeq = node.uiChildren.map(c=> c.Seq)
	var startingWith = specialNodes.filter(s=> childrenSeq.includes(s)).slice(0,2).map(seq=> progNode[seq].Label).concat(node.Children.filter(c=> c.Label.trim() != '').slice(0,3).map(c=> c.Label).filter((item,pos,ary)=> ary.indexOf(item) == pos))
	
	var logTest = false // node.Role == 'menubar'
	if (logTest) log ('buildDescriptions', node.Seq, specialNodes.filter(s=> childrenSeq.includes(s)).slice(0,2), childrenSeq) 
		
	//.filter(s=> s!=0).map(seq=> progNode[seq].Label).filter(c=> c.trim() != ''))
	if (logTest) log ('node.Children', node.Children.map(n=> n.Label))
	//JSON.stringify(startingWith))
//	if (logTest) log ('buildDescriptions', specialNodes.slice(0,3).map(seq=> progNode[seq].Label))
	
	if (node.Role != '') node.Description += (node.Role.toUpperCase()) + ', '
	if (node.Click != -1) node.Description += ('Clickable, ') 
//	if (node.Role == 'image') node.Description += ('IMAGE, ')
	if (node.Children.length > 0) node.Description += ( 'LIST, ')
	if (logTest) log ('.', node.Description)	
	
	if (startingWith.length > 0) {
		if (startingWith[0] == node.Label.trim()) {
			startingWith = startingWith.slice (1)
		}
		node.Description += (node.Label)
	if (logTest) log ('..', node.Description)	

		node.Description += ', of '
		var roleHisto = histogram (node.Children, 'Role');
		if (logTest) log ('roleHisto', JSON.stringify(roleHisto))
		
		if (roleHisto.length > 0 && roleHisto[0][1] > 1 && roleHisto[0][0].trim() != '') {
			node.Description += roleHisto[0][1] + ' ' + roleHisto[0][0] + 's'
		
			if (roleHisto[0][1] < node.Children.length) 
				node.Description += node.Children.length - roleHisto[0][1] + ' others '
		} else 
			node.Description += node.Children.length + ' parts '
		
	if (logTest) log ('...', node.Description, startingWith.length, )	
		
//		startingWith = startingWith.filter(n=> n.trim() != '')

//		startingWith = startingWith.sort((a1, a2)=> cmp(specialNodes.indexOf(a1.Seq),specialNodes.indexOf(a2.Seq)))

		if (startingWith.length > 0)
			node.Description += ' contains, ' + startingWith.slice(0,2).join(', + ')
		if (startingWith.length > 2)
			node.Description += ', plus ' + (startingWith.length -2) + ' more'
	if (logTest) log ('....', node.Description)	
	} else if (node.Label != '') 
		node.Description += node.Label
	
//log ('.....Label', node.Label)	
	if (logTest) log ('.....', node.Description)	
	if (node.Value != '')
		node.Description = node.Description + ', value is ' + node.Value;
	if (logTest) log ('......', node.Description)	

} catch(err) {
	console.log ('*...Error buildDescriptions', err.message, err.stack);
}
}

/* 
	Helper for debugging, puts a cononical attribute into the actual dom so it will show up in
	elements in the browser debugger
*/
function setAttribute (node, attr, value) {
	if (!SetAttribute || node == null || node.Node == null) return;
	node.Node.setAttribute (attr, value);
}

/* 
	Helper for debugging that puts borders around elements
*/
function setBorder (node, value) {
	if (!SetBorder || node == null || node.Node == null) return;
	node.Node.style.border = value;
}

/* 
	Helper for debugging that allows you to turn off logging for production
*/
function log (message) {
	if (!ConsoleLog) return;
	console.log(...arguments);
}

function clog (value) {
	console.log ('-->', ...arguments)
	return value
}

function showBlank (message) {
	if (typeof message == "undefined") message = 'undefined'
	if (message == null) message = 'null'
	if (message == '') return "''"
//	if (message.trim() == '') return "' '"
	return message;
}

/* 
	Diagnostic
*/
function logBlank (message) {
//	return
	for (let arg = 0; arg < arguments.length; ++ arg) 
		arguments[arg] = showBlank(arguments[arg]).toString();
	console.log (...arguments);
}

/* 
	Diagnostic
*/
function falseMsg (message) {
	console.log(...arguments);
	return false;
}

/* 
	Diagnostic
*/
function s (arg) {
	return udefEmpty(arg).toString()
}

/* 
	Diagnostic
*/

function levelCount (node, maxLevel,count) {
	node.Children.map(child => count = levelCount(child, maxLevel-1, count));
//	log ('levelCount', node.Seq);
	
	if (level >0) count++;
	return count;
}

/* 
	Diagnostic
*/
function topDown (node, count=0) {
//	log ('topDown', node.Seq);
	count++;
	if (count >= 100000) return 100000
	node.Children.map(child => count = topDown(child,  count));
//	for (let i=0; i<node.Children.length; i++) 
//		 count = topDown(node.Children[i],  count);

	 return count;
}

function walkTree (node, funct, result=[]) {
	result.push(funct(node))
	node.Children.map(child => result = walkTree(child,  funct, result));
	return result
}

function selectTree (node, funct, result=[]) {
	if (funct(node)) result.push((node/* , node.Seq, node.Label */))
	node.Children.map(child => result = selectTree(child,  funct, result));
	return result
}

/* 
	Diagnostic
*/
function bottomUp (node, count=0) {
	node.Children.map(child => count = bottomUp(child, count));
//	myArray.slice(0).reverse().map(function(...
//	for (let i=node.Children.length-1; i>= 0; i--) 
//		 count = bottomUp(node.Children[i],  count);
	 
//	log ('levelCount', node.Seq);
	count++;
	if (count >= 100000) return 100000
	return count;
}



function setId (node, level = 0) {
	if (level == 0) nodeById = {}
	
	if (node.Id == '' && node.Parent != null /* && node.Parent.uiChildren != null */) {
		node.hashTag = getHashTag (node) /* + node.ChildTags */
		var nodeId = hashCode(node.hashTag/*  + level */)
//		console.log ('setId', node.Seq, node.hashTag )
		
		if (nodeId in nodeById) {
			nodeById[nodeId].Id = xPath(nodeById[nodeId])
			node.Id = xPath(node)
//			console.log ('setId collision', nodeId, nodeById[nodeId].Id, node.Id, node.Seq, nodeById[nodeId].Seq, Object.keys(nodeById).length, ' - ', node.hashTag) 
			
//			nodeById[nodeId].Text, udefEmpty(node.Node.innerText).length, node.Text)
		} else {
//			console.log ('setId', nodeId, node.Label)
			node.Id = nodeId
			nodeById[node.Id] = node
		}
	} else
		nodeById[node.Id] = node
//?	linearTree.push(node)
	domIdLabel[node.Seq] = node.Id + '-'+node.Label
	node.Children.forEach (c=> setId(c, level+1))
}

function xPath (node) {
	let parents = parentVector (node).slice(0, -1)
//	console.log (parents.map(n=> n.Seq))
	return parents.map(m=> '$' + m.TagName + m.Parent.Children.map(n=> n.Seq).indexOf (m.Seq)).join('')
}

function getHashTag (node) {
	var hashTag = node.TagName + node.ClassList + node./* ui */Children.map(c=> c.Text).join('') + node.Parent./* ui */Children.map(c=> c.Text).join('') + node.Href +node.ClickURL +node.Position +node.FontSize +node.FontWeight +node.FontStyle +node.TextAlign +node.Color +node.BGcolor +node.BGposition +node.Border +node.BGimage +node.Text +node.Href +node.Src + node.Label
	
/*  *//* node.H.toString() + '-' +  node.W.toString() +  */
	
	node.Node.getAttributeNames().filter(name=> !name.startsWith('wlz_')).forEach (attName => hashTag +=  attName+'='+node.Node.getAttribute(attName))
	
	return hashTag
}

function setHashTags (node, result=[]) {
	if (node.Text != '')
		node.HashTag = hashCode(node.TagName +node.ClassList +node.Text +node.Href +node.ClickURL)//+node.Node.outerHTML)
	else // if (node.Label != '')
		node.HashTag = hashCode(node.TagName +node.ClassList +node.Label +node.Href +node.ClickURL)//+node.Node.outerHTML)
		
//	else
//		node.HashTag = hashCode(node.TagName +node.ClassList +node.Description +node.Href +node.ClickURL)
//	node.test=node.TagName +node.ClassList +node.Text +node.Href +node.ClickURL
	linearTree.push(node)
	if (node.Id == '' /* && node.Text != '' */) {
		if (node.HashTag in nodeById) {
//			console.log ('setHashTags collision', node.Seq, nodeById[node.HashTag].Seq, node.Label)
			nodeById[node.HashTag].Id = ''  // set Id = ''
		} else {
			node.Id = node.HashTag
			nodeById[node.Id] = node
		}
	} else
		nodeById[node.Id] = node
	
	if (node.Children.length == 0) result.push(node) 
		
	node.Children.forEach (c=> result = setHashTags(c, result))
	return result
}

function setRandomIds (node, result=0) {
  try {
	if (node.Id == '') {
		node.Id = hashCode (window.crypto.randomUUID()) 
		setErrMsg(node, 'setRandomIds,')
//		logBlank ('setRandomIds', node.Id, node.Text)
		nodeById[node.Id] = node
		result += 1
	}
	node.Children.map(child => result = setRandomIds(child, result));
	return result
  } catch(err) {console.log ('*...setRandomIds', node.Seq, err.message, err.stack);}
}

function setErrMsg (node, str) {
	if (node.ErrMsg.includes (str)) return
	else node.ErrMsg += str
}
/* function setParentNodeIds (nodeArg, prevNodeArg) {
	let node = nodeArg
	let prevNode = prevNodeArg
	logBlank ('setParentNodeIds - 0', node.Id, node.Label, prevNode.Label)
	while (node != null && prevNode != null) {  //  && node.Id == '' 
		node.Id = prevNode.Id
		nodeById[node.Id] = node
//		buildNodeLookup[node.Id] = node.Node;
		setErrMsg(node, 'setParentNodeIds,')
		logBlank ('..setParentNodeIds', node.Seq, prevNode.Seq, node.Level, prevNode.Level, node.Id)
		node = node.Parent
		prevNode = prevNode.Parent
	}
//	if (node != null || prevNode != null) 
//		logBlank ('*...setParentNodeIds level mismatch', node != null, prevNode != null)
}

function getPrevNodeById (id) {
	if (id in prevNodeById)	return prevNodeById[id]
	else 					return {'Id': 'none', 'Seq': '-99', 'Children': [], 'HashKey': ''}
}
[{'Id': 'one', 'Seq': '-99',  'HashKey': 'xyzzy'}, {'Id': 'two', 'Seq': '-98', 'HashKey': 'fooey'}, {'Id': 'Three', 'Seq': '-97','HashKey': 'Bar'}]
function getNodeById (id) {
	if (id in nodeById)	return nodeById[id]
	else 					return {'Id': '', 'Seq': '', 'Children': []}
}
 */
/* 
	Helper function to turn a string into a hash
*/
function hashCode(str) {
    var hash = 0;
    if (str.length == 0) {
	 
        return hash;
    }
    for (var i = 0; i < str.length; i++) {
        var char = str.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
 
    return 'i'+ (hash + 2147483647);
}

/* 
	Diagnostic
*/
/* 
function timer (name, startTime) {
	let now = Date.now();
	let time = now - startTime;
	if (time > 500) console.log ('.... ' + name, time)
	return now;
}
 */
/* 
	Traverse the cannonical dom tree (bottom up) with two functions;
	1)	Find a collection of elements in a single line but with different fonts, colors etc as well as links
		and turn it into a node of the single line of text with all links as children.  
	2)	Find a collection that contains headers and paragraphs (eg Wikipedia) and translate it into collections
		labeled with the header and paragraphs for children.  (this is the normal to encode the cannonical dom)
	
	Cases
	1)	Links ==> 	Label=='', All children are differnt links
	2)	Single Line	Label=='', Some children may not be links or are the same link
*/

function fixLinks (node) {

	if (node.Display == 'block' /* && node.Text != '' */
		&& !findAnyFunct(node.Children, (n=> n.Display=='block' || n.Role == 'input'))) {
		let children = selectUiNodes(node, []).filter(c=> c.Seq != node.Seq && c.Label != ''); 

		let clickHisto = histogram (children, 'Click').filter (c=> c[0] != -1);
		
		if (clickHisto.length == 0 || node.Text == '') return 
		
		setAttribute (node,'wlz_fixLinks', clickHisto.length);
		
		deleteNodes (node, flatten);
		node.Leaves = 1;

		children.forEach (c=> {
			if (c.Click == -1) {	//Click is inherited should we use BaseClick??
				deleteNode (c, 'fixLinks ' + node.Seq)
			} else  {
				c.Parent.Children = c.Parent.Children.filter (n=> n.Seq != c.Seq);
				c.Parent.Links.push(c);
//				c.Role = 'link';
				c.Parent.Leaves -= c.Leaves;					//links are not visible until you look for them
			}
		});

// this is duplicated in another routine
/* 		if (node.Text == '') {
			node.Text = udefEmpty(node.Node.innerText).toString().trim().replace(/\r?\n|\r/g, " ")
			
			let test = node.Label.replace(/\r?\n|\r/g, "")			//WTF two replace on same Label
			if (test.replace(',','').search(/^\$[\s0-9\.,]+$/) == 0) node.Role = 'currency';  // ???????
			else if (test.replace(',','').search(/\d+¢/) == 0) node.Role = 'currency'; 
			else if (test != '' && !isNaN(test)) node.Role = 'number';
			if (['number', 'currency'].includes(node.Role)) node.Text = test
		} */
	}
	node.Children.map(child => result = fixLinks(child));	
}

/* 
	Helper function to determine if the elements in a collection are a single row
*/
/* function singleRow (node) {
	let nodeList = selectUiNodes(node, []).filter(c => c.Seq != node.Seq)
//	for (n of nodeList) log ('X:'+n.X, 'Y:'+n.Y, 'W:'+n.W, 'H:'+n.H)
	return isRow (node)
}

function singleColumn (node) {
	let nodeList = selectUiNodes(node, []).filter(c => c.Seq != node.Seq)
	return isColumn (node)
}

function pointInRange (point, range1, range2) {
	log ('..', point, range1, range2)
	return point >= range1 && point < range2
}
 */
/* 
	Main program to generate a cannonical dom from the actual dom supplied by the browser
*/

function testNode (node, target, msg, result) {
	if (node.Seq == target.Seq) {
		console.log ('*...Node Exists-' + msg, target.Seq, target.Parent.Seq, target.Parent.Children.map(c=> c.Seq))
		return true;
	}
	for (var i=0; i < node.Children.length; i++) {
		if (node.Children[i].Seq == target.Seq)
			console.log ('. target parent', node.Seq, node.Children[i].Parent.Seq, target.Seq, node.Children[i].Children.map(c=> c.Seq))
		result = testNode ((node.Children)[i], target, msg, result);
		if (result) return result;
	}
	return false;
}

function testDelete (node,msg) {
	node.Children.forEach (c=> {
		if (c.Deleted) 
			console.log ('*...Didnt Delete-' + msg, c.Seq, node.Seq, c.DeleteMsg, node.Children.map(d=> d.Seq), c.Deleted);
	})

	node.Children.map(child => testDelete(child, msg));
}

function testParent (node) {
	node.Children.forEach (c=> {
		if (c.Parent.Seq != node.Seq) 
			console.log ('*...Parent Error ' + c.Parent.Seq, node.Seq);
	})

	node.Children.forEach(child => testParent(child));
}

function findGridRowCol (node, level=0) {
	if (level == 0) {
		textHisto = listHisto (root.uiChildren.filter(n=> n.Text != '' && n.Text != null).map(c=> stripNumbersFromKey(c.Text)))
	}
		
	log ('findGridRowCol', node.Seq, node.Children.length)
	let xHist = histogram (node.Children, 'X', 2);
	let yHist = histogram (node.Children, 'Y', 2);
	node.NRows = yHist.length
	node.NCols = xHist.length

//	console.log ('findGridRowCol', node.Seq, JSON.stringify(xHist), JSON.stringify(yHist)) //, xHist.length, yHist.length, node.Children.map(c=> ''+ c.Seq +'-'+ c.X +'-'+ c.Y +'-'+ c.W +'-'+ c.H))

	if (xHist.length == 1 && yHist.length > 1/*  && node.W < 800 */) {
//		if (histogram (node.labelChildren, 'Appearance').length >1) {
			log ('--column', node.Seq)   //, histogram (node.labelChildren, 'Appearance'))
			setList (node, 'column','wlz_col')
			node.Children.filter(c=> c.Children.length>0).map (c=> setList (c, '', 'wlz_col_elmt'))
//		}
//		return
	} else if (yHist.length == 1 && xHist.length > 2) {
		log ('--row')
		setList (node, 'row','wlz_row')
		node.Children.filter(c=> c.Children.length>0).map (c=> setList (c, '', 'wlz_row_elmt')) 
//		return
	} else if (xHist.length >= 2 && yHist.length >= 2
	  && node.Children.length > Math.max(xHist.length, yHist.length)) {
		
		yHist = yHist.filter(c=> c[1] >1)
		let gridY = yHist.map(c=> c[0])
		log ('--gridY', gridY)
		let gridNodes = node.Children.filter(c=> gridY.includes(c.Y.toString())) 
		log ('gridNodes', node.Children.map(c=> c.Seq))
		xHist = histogram (gridNodes, 'X')
		if ([0,1].includes(xHist.every (c=> Math.abs(yHist.length - c[1]) <= 1))
		  || [0,1].includes(yHist.every (c=> Math.abs(xHist.length - c[1])))
		) {			
			setList (node, 'grid', 'wlz_grid')
			deleteNodes(node, flatten)
//			node.Label = 'grid'
			gridNodes.filter(c=> c.Children.length>0).forEach (c=> {
				setList (c, '', 'wlz_grid_elmt')				
			}) 
		} else log ('--none', xHist.map (c=> ''+c[0]+'-'+Math.abs(yHist.length - c[1])), yHist.map (c=> ''+c[0]+'-'+Math.abs(xHist.length - c[1])))
/* 	} else if (node.Children.length > 3 && histogram(node.Children, 'Area').length == 1) {
		log ('--area')
		setList (node, 'group', 'wlz_group')
		deleteNodes(node, flatten)
		node.Label = ' '
		node.Children.filter(c=> c.Children.length>0).forEach (c=> {
			setList (c, '', 'wlz_group_elmt')				
		}) 
 *//* 	} else if (!node.Children.some (c=> node.Children.some (d=> (d.X>c.X && d.X<c.X+c.H) || (d.X+d.H>c.X && d.X+d.H<c.X+c.H)))) {
		log ('--column2', node.Seq)   //, histogram (node.labelChildren, 'Appearance'))
		setList (node, 'column','wlz_col2')
		node.Children.filter(c=> c.Children.length>0).map (c=> setList (c, '', 'wlz_col2_elmt'))
 */	} else {
		log ('---none')
//		node.Children.map (c=> log ('overlap ' + node.Seq +','+c.Seq+'->'+ node.Children.map (d=> c.Seq+'-'+((d.X>c.X && d.X<c.X+c.H) || (d.X+d.H>c.X && d.X+d.H<c.X+c.H)).toString())))
//		node.Children.map (c=> node.Children.map (d=> log('overlap '+node.Seq+' '+(d.X>c.X).toString() +','+ (d.X<c.X+c.H).toString() +' - '+ (d.X+d.H>c.X).toString() +','+ (d.X+d.H<c.X+c.H).toString())))
	}
	node.Children.map(child => findGridRowCol(child, level+1));
	return true 
}

function setList (node, listType, attribute) {
	if (node.ListType == '' && listType != '') node.ListType = listType
	node.RoleType = 'list'
	setAttribute (node, attribute, '');
}

function flattenSmallDivs (node) {
	if (node.Role == 'grid' || node.ListType=='row' || node.ListType=='column' || node.Role == 'group') {
		node.Children.filter(c=> c.Area < 300000 && c.Leaves < 20 && c.Leaves > 1).forEach (child => {
			log ('..setAttribute')
			setAttribute (child, 'wlz_SmallDivs', '')
			deleteNodes (child, flatten)	
			return
		}) 	
	}
	
	node.Children.map(child => flattenSmallDivs(child));
}

/* function listCounter (node) {
	node.Children.map (child => listCounter (child));
	if (node.Children.length == 0)
		node.ListCount = 0
	else
		node.ListCount = Math.max (...node.Children.map(c=> c.ListCount))
	
	if (node.RoleType == 'list') node.ListCount +=	 1
//	log ('listCounter', node.Seq, node.RoleType, node.ListCount, node.Children.map(c=> c.ListCount))
} */
	
/* function fillInMissingDivs (node) {
	if (node.Children.filter (c=> c.RoleType == 'list').length > 0) {
		node.Children.forEach(c=> {
		
			if (c.ListCount == 0 && c.Leaves > 1) {
				c.RoleType = 'list'
				setAttribute (c,'wlz_miss', '');
				return
			}
		})
	}
	
	node.Children.map(c=> fillInMissingDivs(c))
} */

// Top down, set lists for boxes that have children.Area < 50000
/* function fillInMissingDivs2 (node) {
	log ('fillInMissingDivs2', node.Seq, node.Area, node.Children.map(c=> c.Seq+'_'+c.Role+'_'+c.Area+'-'+ c.Label))
	log ('fillInMissingDivs2', node.Seq, node.RoleType, node.Leaves, node.Text == '' 
	  , node.Children.filter(c=> c.Role != 'image').map (c=> ''+node.Seq+'-'+ c.Area) 
//	  , node.uiChildren.filter(c=> c.Role != 'image').map(child => ''+node.Seq+'-'+ child.Area)
	  )
																			
//	if (node.RoleType == '' && node.Leaves > 1 && node.Text == '' 
//	  && node.Children.filter(c=> c.Role != 'image').every (c=> c.Area < 50000) 
//	  && Math.max (...node.uiChildren.filter(c=> c.Role != 'image').map(child => child.Area)) < 100000
	let largeChildren = node.Children.filter(n=> n.Role != 'image' && n.Area >= 50000).length
	if (node.RoleType == '' && node.Leaves > 1 && node.Text == '' 
	  && largeChildren <= 1  
	  ) {
		log ('fillInMissingDivs2', node.Seq)
		node.RoleType = 'list'
		setAttribute (node,'wlz_miss2', '');
		return
	}
	if (node.Leaves == 1 || node.Text != '') return

	for (child of node.Children) fillInMissingDivs2(child);
} */

/* function smallDivUnlist (node) {
	node.Children.forEach(child => smallDivUnlist (child));
	if (node.RoleType == 'list' && node.Role != 'grid'  && node.Role != 'row' && (node.Leaves <= 1 || node.Area < 15000 || (node.ListType=='column' && node.Parent.Label != '' && histogram (node.uiChildren, 'Appearance').length <= 1))) {
		log ('--Small Div unlist', node.Seq)
		node.RoleType = 'unList'
		setAttribute (node,'wlz_zapp', node.ListType=='column' && node.Parent.Label != '' && histogram (node.uiChildren, 'Appearance').length <= 1)
	} 
} */
/*
Look at first element, if it is a label, use it
If outer div contains label, switch to outer div
If all appearances are the same unlist
*/
function findLabels (node) {
	node.Children.forEach(child => findLabels(child));
	var labelNode = null
//	console.log ('findLabels', node.Seq, node.uiChildren.length)
	if (/* node.RoleType == 'list' && node.ListType=='row' && */ node.uiChildren.length > 2) {  
		let textNodes = getTextChildren (node).filter(c=> c.Seq != node.Seq).sort((a,b) => a.Seq - b.Seq)
node.TextNodes = textNodes.map(c=> c.Text).join(',')
//		console.log ('.findLabels',getTextHisto(node.Text), node.Label)
		if (node.Label == '' || getTextHisto(node.Text) > 2) {		//Replace multiples
//			console.log ('..findLabels', textNodes)
			if (textNodes.length > 0 ) {
				let appearanceHisto = listHisto (textNodes.map(c=> c.Appearance), 'Appearance')
//				console.log ('...findLabels', appearanceHisto, appearanceHisto[textNodes[0].Appearance], node.Emphasis==textNodes[0].Emphasis)
				if (appearanceHisto[textNodes[0].Appearance]==1 && node.Emphasis==textNodes[0].Emphasis) {
					labelNode = textNodes[0]
				}
			}
		}
	}
	
//	Look for label before the div
	if (/* node.RoleType == 'list' &&  */labelNode == null) {
		let siblings = node.Parent.Children.sort((a,b) => a.Seq - b.Seq);
		let index = siblings.map(c=> c.Seq).indexOf(node.Seq)
		log ('....findLabels', index, siblings.map(n=> n.Text))
		if (index > 1) {
			let nodeBefore = siblings[index-1]
			log ('.....findLabels', node.Leaves, nodeBefore.Leaves, node.Y, nodeBefore.Y, nodeBefore.H, nodeBefore.Emphasis, nodeBefore.Emphasis, node.Emphasis)
			if(node.Leaves > 1 && nodeBefore.Leaves < 5 && node.Y > nodeBefore.Y && nodeBefore.H < 100 && (nodeBefore.Emphasis> 300 || nodeBefore.Emphasis > node.Emphasis)) {
				moveNode (nodeBefore, node)
				labelNode = nodeBefore   //lookInside(nodeBefore)
				log ('.......findLabels', labelNode.Seq, labelNode.Text)
			}
		}
	} 
	if (labelNode == null && node.Text != '') {
		node.Label = node.Text
		return
	}
	
	if (labelNode != null) {
		node.Label = labelNode.Text
//		if (node.Role == '') 
		node.Role = 'Heading!, '
		if (labelNode.Click != -1) labelNode.Label = labelNode.Text
		else 						deleteNode(labelNode, 'findLabels')
		labelNode.IsLabel = node.Seq
		setAttribute (node,'wlz_findLabels', labelNode.Seq)
		setAttributes (node)
//		console.log ('.......-findLabels', node.Label, labelNode.Seq)
	}
}

/* function testLabel (label, appearanceHisto, maxEmphasis) {

//	if (node.Label != '') return true
	
	if (appearanceHisto[label.Appearance] == 1 && (getTextHisto(label.Text) <= 2)) {
		return true
	}
	return false
} */

function fixMissingLabels (node) {

	if (node.Leaves > 2 && node.RoleType == 'list' && node.Label == '' && node.Children.every(c=> c.Area < 100000) && (node.ListType=='column' || node.ListType=='column') 
//		!node.Children.every(n=> n.Role == 'paragraph') && && node.Children.every((c,i,a)=> c.W==a[0].W && c.Leaves>1) && node.W<500
	  ) {
//		((Math.max(...node.Children.map(c=> c.Area  )) < 200000 && node.Parent.Children.length != 1)
//		|| 
//		|| node.ListType=='grid' // || isGroup(node) Not defined
		node.Label = ' '
//		log ('fixMissingLabels', node.Seq, Math.max(...node.Children.map(c=> c.Area)))
		setAttribute (node,'wlz_fixmissing', '')
		return
	}
//	else log ('else', node.Seq, Math.max(...node.Children.map(c=> c.Area)))
	node.Children.map(child => fixMissingLabels(child));
}
 
function combineTextDivs (node) {
	if (node.Parent != null && node.Parent.uiChildren != null && node.Parent.uiChildren.length > 1 && node.Parent.uiChildren.length < 50) {
		let t = node.Parent.uiChildren.map(c=> c.Text).filter(c=> c.Text!='').filter((item,pos,ary) => ary.indexOf(item) == pos).join(' ')
//		if (t.length < 26) console.log ('t.length=', node.Parent.uiChildren.map(c=> c.Text), node.Parent.uiChildren.map(c=> c.Text).filter((item,pos,ary) => ary.indexOf(item) == pos))
		cur = 0
		for (var next=1; next<t.length; next++) {
			if (inRow(t[cur], t[next])) {
				t[cur].Text += ' ' + t[next]
				deleteNode (t[next], 'combineTextDivs')
			} else {
				if (cur < next-1) setAttribute (node,'wlz_combinetxt', t[cur].Text)
				cur += 1
			}
			if (cur < next-1) setAttribute (node,'wlz_combinetxt', t[cur].Text)
		}
	}
	
	node.Children.map(c=> combineTextDivs(c))
}

function inRow (t1, t2) {return (t1.Y > t2.Y2) && (t1.Y2 < t2.Y)}
/* 
wlz_combinetxt 95 false (11) [96, 97, 98, 102, 103, 104, 105, 106, 107, 108, 109]
content.js:2786 *... Cannot read properties of undefined (reading 'Click') TypeError: Cannot read properties of undefined (reading 'Click')
    at combineTextDivs (chrome-extension://njamdneagmaofmfnbbjagicgplfpffhn/content.js:2407:18)
 */


/* function combineTextDivs (node) {
 	if (node.Leaves > 1 && node.Leaves < 10 && node.uiChildren.length >1 && node.uiChildren.length < 100) {
		
		var textNode = node.uiChildren[0]
		console.log ('wlz_combinetxt', node.Seq, textNode==null, node.uiChildren.map(c=> c.Seq))
		for (let child of node.uiChildren.slice(1)) {
			if (child==null) console.log ('child==null')
			if ((textNode.Click == -1 || textNode.Click == child.Click)
			  && (textNode.Y > child.Y && textNode.Y < child.Y2) 
			  || (textNode.Y2 > child.Y && textNode.Y2 < child.Y2)
			  ) {
				textNode.Text += ' ' + child.Text
				textNode.Click = child.Click
				textNode.RoleType = ''
				setAttribute (textNode,'wlz_combinetxt', textNode.Text)
				deleteNode (child, 'combineTextDivs')
			} else {
				textNode = child[0]
			}
		}
	}
	node.Children.map(c=> combineTextDivs(c))
} */
 
function getTextChildren (node, result = []) {
	if (node.IsLabel!=-1) console.log ('*...getTextChildren', node.Seq, node.IsLabel)
//	let colors = node.Color.slice(4,-1).split(',')
//	let background = node.BGcolor.slice(4,-1).split(',')
//	if (background != '') console.log ('colored Dif', background.map((b,i)=> Math.abs(b-colors[i])), node.Text)
//	if (background == '') console.log ('colored Dif', colors, node.Text)
	
	if (node.Text != ''
		  && !['currency', 'icon', 'input', 'image'].includes(node.Role)
//		  && getTextHisto(node.Text) <= 2
		  && node.Text.length - node.Text.replace(/\d+/g,'').length < node.Text.length * .1
		  ) {
//			if (Math.max(...node.Color.slice(4,-1).split(',')) >= 100) 
//				console.log ('colored Text', node.Text, node.Color)
			result.push(node)
		  } else {
			setAttribute (node,'wlz_skipLabel', node.Text+'='+getTextHisto(node.Text)+'='+
			node.Text.length * 6.+'='+node.Text.replace(/\d+/g,'').length+'='+node.IsLabel)
		  }			
		log ('getTextChildren', node.Seq, node.Children.map(n=> n.IsLabel))
		node.Children.filter(n=> n.IsLabel == -1).forEach(d=> result = getTextChildren(d, result))
	
	return result;
}

function getTextHisto (str) {
	str = stripNumbersFromKey(str)
	if (str in textHisto)
		return textHisto[str]
	else
		return 0
}

function stripNumbersFromKey (key) {
	return key.replace (/[\.\-0-9]+/g, '*')
}

/* function fixLabelBefore (node) {
	log ('fixLabelBefore', node.Seq, node.Label, node.RoleType)
 	if (node.Label == ' ' && node.RoleType == 'list') { 
		let siblings = node.Parent.Children.sort((a,b) => a.Seq - b.Seq);
		let index = siblings.map(c=> c.Seq).indexOf(node.Seq)
		if (index <= 0) return
		
		node.Node.removeAttribute ('wlz_before')
		let nodeBefore = siblings[index-1]

		if(node.Leaves > 1 && nodeBefore.Leaves < 5 && node.Y > nodeBefore.Y && nodeBefore.H < 100 && (nodeBefore.Emphasis> 300 || nodeBefore.Emphasis > node.Emphasis)) {
			console.log ('..fixLabelBefore', node.Seq, node.Parent.Seq, index, siblings.map(c=> c.Seq))
			setAttribute (node,'wlz_before', nodeBefore.Seq)
			moveNode (nodeBefore, node)
			node.Label = nodeBefore.Label   //lookInside(nodeBefore)
			nodeBefore.IsLabel = node.Seq
		}
	}
	node.Children.forEach(c=> fixLabelBefore(c))
} */
/* function lookInside (node) {
	while (node.Label == '') {
		if (node.Children.length != 1) return node.Label  
		node = node.Children[0]
	}
	return node.Label
} */
									  
function final (node) {
/* 	if (node.Label.trim() != '' && node.ListCount == 1)
		node.Groups = node.Groups + ',header'
	if (node.Role == 'grid') 
		node.Groups = node.Groups + ',specialnode' */
	
	setAttribute (node, 'wlz_final', true)  // node.DeleteMe);
	node.numChildren = node.Children.length
	finalNodes[node.Id] = node 
	linearTree.push(node)
	node.Children.map(child => final(child));
}
/* 
function testRoot () {
	console.log ('*... TestRoot', root.Seq, root.Children.map(c=> c.Seq))
	rootText = []
	root.Children.forEach (node=> {
		if (node.Parent == null)
			console.log ('..', node.Seq, node.Label)
	})
}
 */
function scrollAll (node) {
	while ((window.innerHeight + Math.round(window.scrollY)) < document.body.offsetHeight) {
		log ('scrollAll', window.scrollY, window.innerHeight, window.screen.height, document.body.offsetHeight)
		window.scrollBy (0, window.innerHeight)
		}
}

function startMain () {
	log ('domScraper', root.TagName);
//	prevRoot = root
	root = walkDom (document.body, 0, root);
	screenW = root.W;
	screenH = root.H
//	maxEmphasis = 0

//	serializeTree (root, ['Seq', 'Click', 'Id', 'numChildren',  'X',  'Y',  'H',  'W', 'Appearance',  'Emphasis', 'Role', 'TagName', 'Label', 'Position', 'Description', 'Value', 'Href', 'Src'], rootText);
}

function logTrue (root) {ConsoleLog = true}

function logFalse (root) {ConsoleLog = false}

function deleteHiddenOrZero (root) {deleteNodes (root, hiddenOrZero, arguments.callee.caller.name)}

function deleteRedundant (root) {deleteNodes (root, redundant, arguments.callee.caller.name)}

function deleteBlankLabel (root) {deleteNodes(root, blankLabel, arguments.callee.caller.name)}

//function set_id (root) {setID (root, 0)}

function finishMain () {
	root.Children = tesselate
	root.Children.map(n=> n.Parent = root)
	nodeById = {}
	setId (root)
	
	console.log ('+specialNodes', specialNodes.join(','))
/* 	console.log ('maxEmphasis', maxEmphasis)
	let oldHashTagById = sessionStorage.oldHashTagById
	if (oldHashTagById!= null) oldHashTagById = JSON.parse(oldHashTagById)
	else oldHashTagById = {}
	
	
	oldHashTagById = {}
	Object.values(nodeById).map(({Id, hashTag})=> oldHashTagById[Id]=hashTag)
	sessionStorage.oldHashTagById = JSON.stringify(oldHashTagById)  */

	nodeLookup = {}
	for (let key in nodeById) 
		nodeLookup[key] = nodeById[key].Node
	
	root.Label = document.title;
	let metaDescription = [...document.getElementsByTagName("META")].filter(element => element.getAttribute('name') == 'description')[0];
	if (typeof metaDescription != "undefined")
		root.Description = metaDescription.content;
	else
		root.Description = '';
	let url = window.location.href;
	root.Src =  url.slice(url.indexOf('//')+2);
	log ('root.Src', root.Src)
	root.Role = 'Page';
								
//	setID (root, 0)
	final (root)
	
//	markRole (root, 'header')
	root.Children.map(c=> setBorder (c, "3px solid black")) 
	
	printTree(root, PrintTree);
	rootText.push (hashCode (totalText))
	
	log ('oldDomNode', JSON.stringify(Object.keys(oldDomNode)))
	seqMap = {}
	for (seq in Object.keys(oldDomNode)) {
		node = oldDomNode[seq]
		var wlz_seq = parseInt(node.getAttribute('wlz_seq'))
//		console.log('seq in oldDomNode', seq, node.Seq, node.isConnected)
		if (node.isConnected) {
			if (seq != wlz_seq) {
				progNode[wlz_seq].PrevSeq = seq
			}
		}
	}
	let cmp = (a, b) => (a > b) - (a < b)
	rootText.push (JSON.stringify(specialNodes))
	
//	rootText.push (JSON.stringify(specialNodes.sort((a1, a2)=> cmp(targetLabels.indexOf(a1.SpecialType),targetLabels.indexOf(a2.SpecialType))).map(n=> n.Seq)))

//	console.log ('specialNodes.Seq', JSON.stringify(specialNodes.sort((a1, a2)=> cmp(targetLabels.indexOf(a1.SpecialType),targetLabels.indexOf(a2.SpecialType))).map(n=> n.Seq)))

/* 	if (oldSeq in oldDomNode && oldDomNode[oldSeq].isConnected) {
		console.log ('finish oldSeq', oldDomNode[oldSeq].getAttribute('wlz_seq')) 
		rootText.push (oldDomNode[oldSeq].getAttribute('wlz_seq'))
	} else {
		console.log ('finish oldSeq = root.Children[0]') 
		rootText.push (root.Children[0].Seq)
	} */
	
	sortChildren (root)
	log ('js hash', rootText)
	serializeTree (root, ['Seq', 'Click', 'Id', 'numChildren',  /* 'X',  'Y',   */ 'W', 'H', 'Appearance',  'ListCount', 'Role', 'Groups', 'TagName', 'Label', 'Position', 'Description', 'Value', 'Href', 'Src', 'Leaves', 'ErrMsg', 'PrevSeq'], rootText);
	console.log ('totalText', rootText[0],totalText.length) 
//	console.log ('textHisto', textHisto)
	log  ('serialize');
	var endTime = Date.now();
//	markProperties (root, 'Row', [], "10px solid green")
	log ('rootText.length=', rootText.length);
//	log ('topDown=', topDown (root, 0));
	testDelete (root, 'End of Page')
}
/* function markRole (node, role, border="2px solid red") {
	if (node.Role == role && node.Border == '') setBorder (node, border);
	
	node.Children.map(child => markRole(child, role));
	return;
}

function markProperty (node, prop, values, border = "2px solid red") {
//	log ('markProperty', node.Seq, prop, values, border, values.length, prop in node)
	if (prop in node && (values.includes (node[prop]) || values.length == 0)) {
		node.Node.style.border = border; 
//		log ('..markProperty', node.Seq, border)
	} else {
		node.Node.style.border = node.OrigBorder
	}
}
	
function markProperties (node, prop, values, border = "2px solid red") {
//	log ('markProperties', node.Seq, prop, values, border)
	markProperty (node, prop, values, border)
	for (child of node.Children) {
		markProperties (child, prop, values, border);
	}
}

function countHeaders (node, count=0) {
	if(node.Role == 'header') count = count +1
	node.Children.map(child => count = countHeaders(child,  count));
	return count;
}

function visitNodes (node, funct) {
	eval (funct, {})
	node.Children.map(child => visitNodes(child, funct));
}

function setupParameters (node) {
}
*/
function addParameters (node, level=0) {
	
	if (node.Role == 'grid') {
		node.Grid = 1
		node.Children.map (c=> c.GridElmt = 1)
	} else {
//		node.Grid = 0
		node.Children.map (c=> c.GridElmt = 0)
	}
	
	
	node.numChildren = node.Children.length
	
/*  	if (node.Parent != null) {
		let color = "white";
		color = wlzColors[level%22] ;
		if (node.Children.length > 0) node.Node.style.border = "2px solid " + color
		if (node.Display == 'inline')			// WTF Some inline's will not show border
			node.Node.style.display = 'block';	// Can't reproduce in JSfiddle
		node.OrigBorder = "2px dotted " + color
	} */
			
// 	if (node.RoleType == 'list') 
//		node.Node.style.border = "3px solid green"
	
//*	if (node.Role == 'label') 
//		node.Node.style.border = "3px solid red"
//
//	if (node.RoleType == 'unList') 
//		node.Node.style.border = "3px solid blue"
 //	
	
	node.OrigBorder = node.Node.style.border		// keep markProperties from overwriting
	
	node.Children.map(child => addParameters(child, level+1));
}

//-----------------------------------------------------------------------------//
function wlz_splitMain () {
	log ('splitMain........')
	action = [
//		scrollAll,
		startMain, 
		addPatternsLeaves,
		fixSelects,
		deleteHiddenOrZero,
		fixSubNodeClicks,
		combineTextDivs,
		fixLeaves,
		fixFieldSet,
		fixLabels,
		fixLinks,
		labelInputs,
		deleteRedundant,
		fixInherits,				//Moved to after deleteRedundant 7/4/22
		addPatternsLeaves,
//		setSimilar,
//		addPatternsLeaves,
//--------------------------------------------------------
		findGridRowCol,
//		flattenSmallDivs,
//		listCounter,
//		fillInMissingDivs,
//		fillInMissingDivs2,
		findMenuBar,
		labeledPicture,
//-		similarChildren,
//		smallDivUnlist,
		findLabels,	
		fixAria,
//		findPageChooser,
		fixMissingLabels,		
		deleteBlankLabel,
//		fixLabelBefore,
		addParameters,
		sortChildren,
//		listCounter,
//		deleteRedundant,
		tesselatePage,
		computeRoles,
	logTrue,
	logFalse,
		buildDescriptions,
//		setId,
		finishMain
		]
	
	let startTime = Date.now();
	let actionTime = startTime
	
	rootText = [];

	while (Date.now()-startTime < 100000 && actionIdx < action.length) { 
		try {
			let actionTime = Date.now()
			action[actionIdx](root)
			let numNodes = topDown(root,0)
			console.log (actionIdx, Date.now()-startTime, action[actionIdx].name, Date.now() - actionTime, numNodes)
			if (numNodes < 2 && actionIdx > 1) actionIdx = 0
			else								actionIdx++
			
			missingNodes = linearTree.sort((a,b) => b.Seq - a.Seq).slice(0,-1).filter ((n, i, a)=> a[i+1]+1!=a[i+1])
			
/* 			if (missingNodes.length != 0) {
				console.log (action[actionIdx-1].name, missingNodes)
//				speak ('missing nodes')
			} */
			
/* 			if (!root.Children.every((n,i,a)=> i==0 || a[i-1].Seq < a[i].Seq)) {
				console.log ('*...Seq out of order', root.Children.map(n=> n.Seq))
//				speak('Sequence out of order')
			} */

/*  			let target = selectNode(root, 'Id', ["productTitle"])
			if (target == null) console.log ('target = ---')	
			else 
				console.log ('target', target.Seq, target.Id, target.Label) */
			
			
//			testParent (root)
/* 			let targets = selectNodes(root, 'Seq', [94, 233, 379])
			console.log ('Menubars', targets.map(n=> n.Seq +'-'+n.Role)) */
/* */



//			console.log ('...Headers', countHeaders(root))
		} catch(err) {
			console.log ('*...', err.message, err.stack);
		}
	}
	if (actionIdx == action.length) {
		actionIdx = 0
	}
//	console.log ('rootText.length', JSON.stringify(rootText).length)
	return JSON.stringify(rootText)
}

function parentVector (node) { 
	parents = []
	while (node != null) {
		parents.push (node)
		node = node.Parent
	}
	return parents
}

//newLeaves = []
prevLeaves = {}
function wlz_domScraper () { 
	console.log ('domscraper')
	ConsoleLog = false;
	console.log ('..............START....................')
	idxOf = ((a,b)=> a.reduce((acc,val,idx)=> acc==-1?(b.includes(val)?idx:-1):acc, -1))
	root = createNode(null, {Parent: null, Seq: -1, Click: -1, Role: 'Root', ListType: '', TagName: 'ROOT', Id: 0, Appearance: -1, Class: -1, List:0, FontSize: -1,FontWeight: -1, Margin: -1, X: 0, Y: 0,H: 99999,W: 99999, Text: '', Label: 'Root', ErrMsg: ''}); 

/* 	if (typeof newLeaves == 'undefined') {
		newLeaves = []
		prevLeaves = {}
	}
	console.log ('set newLeaves', newLeaves)
 */	nodeById = {}
	nodeLookup = {}

	seq = 0;

	wlzColors = ['#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe', '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080', '#ffffff', '#000000']
	alert = null;
	actionIdx = 0
	//buildNodeLookup = {}; // htmlElement by Id
	if (typeof domNode != 'undefined') oldDomNode = { ...domNode }
	else								oldDomNode = {}
	if (typeof domIdLabel != 'undefined') olddomIdLabel = { ...domIdLabel }
	else								olddomIdLabel = {}
	
	domNode = {};   //  htmlElement by Seq
	domIdLabel = {}
	prevNodeById = {}
	progNode = {}	//  node by Seq
	finalNodes = {}
	patternContent = {}
	textHisto = {}
	prevDupParents = []
	dupParents = new Set()
	//logBlank ('set dupParents', dupParents)
	linearTree = []
	tesselate = [];
	rawData = [];
	rootText = [];
	dissappearedTree = {}
	xMin = 99999;
	xMax = 0;
	screenW = 0;
	screenH = 0;
	maxEmphasis = 0
	prevNode = null;
	totalText = ''
	specialNodes = []
	targetLabels = ['search', 'add to', 'cart', 'buy', 'shop now', 'bid', 'view deal', 'continue shopping', 'log in', 'login', 'sign in']
//(n=> n.Role=='input' && (incl(n.Label,'search') || incl(n.ClassList,'search')))
	PrintTree =  -1;
	SetAttribute = true;
	SetBorder = false;
	//getTag (root)
	return wlz_splitMain();
}

//def putValue(current, value):
function wlz_putValue(seq, value) {
	console.log ('putValue', seq, value, nodeLookup[seq].Seq)
	if (domNode[seq] == null) return
	let node = domNode[seq]
	node.value = value
		node.Node.dispatchEvent(new Event('dataavailable', { 'bubbles': true }));
}


//def click(node):
//	if (node.data['Click'] != -1):
//			callJs('click', node.data['Id'])
function wlz_click(seq) {
	console.log ('click', seq, nodeLookup[seq].Seq)
	if (domNode[seq] == null) return
	let node = domNode[seq]
	if (node.selected != null) {
		node.selected=(!(node.selected=='true')).toString();
		console.log ('--', node.selectedIndex)//, node.options[node.selectedIndex].text)
		node.Value = node.options[node.selectedIndex].text
		node.dispatchEvent(new Event('change', { 'bubbles': true }));
	} else if (node.ariaSelected != null) {
		node.ariaSelected = (!(node.ariaSelected=='true')).toString();
	} 
	node.dispatchEvent(new Event('mousedown', { 'bubbles': true }));
	node.dispatchEvent(new Event('mouseup', { 'bubbles': true }));
	node.click();
}

//def scrollTo(node):
function wlz_scrollTo (seq) {
//	console.log ('scrollTo', seq, domNode[seq])
	if (domNode[seq] == null) return
	domNode[seq].scrollIntoView(true);
}

//def scrollScreen(y):
function wlz_scrollScreen(y) {
	console.log ('scrollScreen', seq, nodeLookup[seq])
	if (domNode[seq] == null) return
	window.scrollBy (0, y)
}
	
function wlz_drawBorder (seq, border) {
//	console.log ('wlz_drawBorder', seq, border, domNode[seq])
	if (domNode[seq] == null) return console.log ('wlz_drawborder domNode does not exist')
	try {
		let node = domNode[seq]
//		console.log ('node==null', node==null)
		if (node != null) {
//			console.log ('node != null', node != null)
			node.style.outline = border 
//			console.log (node.style.border)
		} else 
			console.log ('drawBorder, node == null', Object.keys(nodeLookup).length)
	} catch (err) {console.log(err.message, err.stack)}
}

//extension.execJS ('window.location.href = "http://' + url + '"')
//extension.execJS ('window.location.href = "http://' + oldURL + '"')
//extension.execJS ('window.location.href = "http://' + root.data['Src'] + '"')

function wlz_newURL (url) {
	console.log ('wlz_newURL')
	try{window.location.href = 'http://' + url}catch(err) {}
}

//extension.execJS('try{window.history.go(-1)}catch(err) {}')
function wlz_prevURL () {
	console.log ('wlz_prevURL')
	try{window.history.go(-1)}catch(err) {}
}

function wlz_reload () {
	window.location.reload();
}

function wlz_seqMap () {
	if (typeof oldDomNode == 'undefined') return console.log ('oldDomNode == undefined')
console.log ('wlz_seqMap')	

	for (seq in Object.keys(oldDomNode)) {
		node = oldDomNode[seq]
		if (node.isConnected) {
			if (seq != parseInt(node.getAttribute('wlz_seq')))
				console.log ('..', seq, ' - ', parseInt(node.getAttribute('wlz_seq')))
			else console.log ('same')
		} else 
			console.log ('..', seq, 'Missing')
	}
}

function wlz_current (oldSeq) {
	if (typeof oldDomNode == 'undefined') return console.log ('oldDomNode == undefined')
	console.log ('wlz_current')	

	if (oldSeq in oldDomNode && oldDomNode[oldSeq].isConnected) {
		console.log ('finish wlz_current', oldSeq, oldDomNode[oldSeq].getAttribute('wlz_seq')) 
		let node = progNode[oldDomNode[oldSeq].getAttribute('wlz_seq')]
		console.log ('..', node.Seq, node.Id, node.Text, node.Label, node.Description)
		return (oldDomNode[oldSeq].getAttribute('wlz_seq'))
	} else {
		console.log ('finish wlz_current = ', oldSeq, 'root.Children[0]') 
		return (root.Children[0].Seq)
	}
}

function wlz_seqLookup (seq) {
	if (!(seq in domNode)) return 'not found'
	
	return (domNode[seq].getAttributeNames().map(a=> a+'='+domNode[seq].getAttribute(a))).join (', ')

}
