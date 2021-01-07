const TEXT_AREA = new ElementScript("TEXT_AREA", {
	init(l, font, paddingEM = 0.5, multiline = true, renderText = (text, font, pos, getLoc, lineIndex) => l.renderer.draw(Color.BLACK).text(font, text, pos)) {
		this.engine.scene.mouseEvents = true;
		l.renderer = this.engine.renderer;
		l.keyboard = this.engine.keyboard;
		l.clipboard = this.engine.clipboard;
		l.canvas = this.engine.canvas;
		l.mouse = this.engine.mouse;
		l.focused = false;
		l.value = "";
		l.font = font;
		l.caretColor = Color.BLACK;
		l.highlightColor = new Color(10, 10, 255, 0.2);
		l.multiline = multiline;
		l.renderText = renderText;
		l.renderTextOffset = Vector2.origin;
		l.selectionStart = 0;
		l.selectionEnd = 0;

		l.padding = paddingEM * l.font.size;
		l.scrollBarSize = 20;
		l.scrollSpeed = 20;
		l.scrollOffset = Vector2.origin;
		l.updateTextBoundingBox();

		l.keyboardShortcuts = ["a", "z", "c", "v", "x"];

		l.keyTimer = 0;
		l.highlighting = false;
		l.ignored = [];
		l.ignoredRemoval = [];
		l.alwaysIgnored = [];
		l.versions = [];

		l.mouse.onScroll.listen(dy => {
			if (this.hovered) {
				l.scrollOffset.y += Math.sign(dy) * l.scrollSpeed;
				l.clampScrollOffset();
			}
		});
	},
	saveVersion(l) {
		l.versions.push({ start: l.selectionStart, end: l.selectionEnd, value: l.value });
	},
	updateVersionSelection(l) {
		l.versions[l.versions.length - 1].start = l.selectionStart;
		l.versions[l.versions.length - 1].end = l.selectionEnd;
	},
	ignore(l, key) {
		l.ignored.push(key);
		l.ignoredRemoval.push(false);
	},
	alwaysIgnore(l, key) {
		l.alwaysIgnored.push(key);
	},
	getValue(l) {
		return l.value;
	},
	setValue(l, value) {
		l.value = "";
		for (let i = 0; i < value.length; i++) {
			l.processKey(value[i]);
		}
		l.updateTextBoundingBox();
		l.saveVersion();
	},
	blurOthers(l) {
		const elements = this.engine.scene.main.getAllElements();

		for (let i = 0; i < elements.length; i++) {
			const scripts = elements[i].scripts;
			if (scripts.has(TEXT_AREA)) scripts.TEXT_AREA.blur();
		}
	},
	focus(l) {
		l.blurOthers();

		l.focused = true;
		l.selectionStart = l.value.length;
		l.selectionEnd = l.value.length;
	},
	blur(l) {
		l.focused = false;
	},
	selectRange(l, min, max) {
		min = Math.max(min, 0);
		max = Math.min(max, l.value.length);
		l.selectionStart = min;
		l.selectionEnd = max;
	},
	getCharacterIndex(l, p) {
		let index = 0;
		let hitboxGroups = l.value.split("\n");
		hitboxGroups[0] = { array: hitboxGroups[0], startInx: 0 };
		for (let i = 1; i < hitboxGroups.length; i++) {
			hitboxGroups[i] = { array: hitboxGroups[i], startInx: hitboxGroups[i - 1].startInx + hitboxGroups[i - 1].array.length + 1 };
		}

		let yRow = Math.floor((p.y - l.relativeTextViewBox.y) / l.font.lineHeight);
		if (yRow >= hitboxGroups.length) index = l.value.length;
		else if (yRow >= 0) {
			let { startInx, array } = hitboxGroups[yRow];
			array = array.split("").map((char, i) => l.getCharacterHitbox(i + startInx));
			index = (p.x - l.relativeTextViewBox.x < 0) ? startInx : startInx + array.length;
			for (let i = 0; i < array.length; i++) {
				let rect = array[i];
				if (Geometry.pointInsideRect(p, rect)) {
					let rx = (p.x - rect.x) / rect.width;
					return startInx + i + Math.round(rx);
				}
			}
		}
		return index;
	},
	getCharacterHitbox(l, index) {
		let cursorPos = l.getTextLocation(index);
		let box = new Rect(cursorPos.x, cursorPos.y, l.font.getTextLineWidth(l.value[index]), l.font.lineHeight);
		return box;
	},
	getTextLocation(l, index) {
		let value = l.value.slice(0, index);
		let lines = value.split("\n");
		let y = lines.length * l.font.lineHeight;
		let line = lines[lines.length - 1];
		let x = l.font.getTextLineWidth(line);
		let pos = new Vector2(x + l.relativeTextViewBox.x, y + l.relativeTextViewBox.y - l.font.lineHeight);
		return pos;
	},
	getTextLocationColumnRow(l, column, row) {
		let y = l.font.lineHeight * (row + 1);
		let lines = l.value.split("\n");
		let line = lines[row].slice(0, column);
		let x = l.font.getTextLineWidth(line);
		let pos = new Vector2(x + l.relativeTextViewBox.x, y + l.relativeTextViewBox.y - l.font.lineHeight);
		return pos;
	},
	processKey(l, key) {
		if (key === "\n" && !l.multiline) return;
		//adding characters
		let modified = true;

		let start = Math.min(l.selectionStart, l.selectionEnd);
		let end = Math.max(l.selectionStart, l.selectionEnd);

		let control = l.keyboard.pressed("Control");
		let shift = l.keyboard.pressed("Shift");
		let resetSelection = !(control || shift);
		if (key.length === 1) {
			if (control && key.toLowerCase() === "a") {
				l.selectionStart = 0;
				l.selectionEnd = l.value.length;
				modified = false;
			} else {
				let newChar = key;
				let paste = key.toLowerCase() === "v" && control;
				let copy = key.toLowerCase() === "c" && control;
				let cut = key.toLowerCase() === "x" && control;
				let undo = key.toLowerCase() === "z" && control;
				if (undo) {
					if (l.versions.length >= 2) {
						l.versions.pop();
						let state = l.versions[l.versions.length - 1];
						l.selectionStart = state.start;
						l.selectionEnd = state.end;
						l.value = state.value;
						modified = false;
					}
				} else {
					if (copy || cut) l.clipboard.write(l.value.slice(start, end));
					if (!copy) {
						if (paste) {
							newChar = l.clipboard.read();
						}
						if (cut) newChar = "";
						let listValue = l.value.split("");
						listValue.splice(start, end - start, newChar);
						l.value = listValue.join("");
						l.selectionEnd = start + newChar.length;
						l.selectionStart = l.selectionEnd;
						if (paste) l.selectionStart = l.selectionEnd = start + newChar.length;
						modified = true;
					} else modified = false;
				}
			}
		}


		//arrow keys
		if (key.slice(0, 5) === "Arrow") {
			if (l.selectionEnd === l.selectionStart || shift) {
				if (key === "ArrowLeft") l.selectionEnd--;
				if (key === "ArrowRight") l.selectionEnd++;
			} else {
				if (key === "ArrowLeft") l.selectionEnd = l.selectionStart = start;
				if (key === "ArrowRight") l.selectionEnd = l.selectionStart = end;
			}
			if (key === "ArrowUp" || key === "ArrowDown") {
				let p = l.getTextLocation(l.selectionEnd);
				p.y += ((key === "ArrowUp") ? -0.5 : 1.5) * l.font.lineHeight;
				p.x += l.font.lineHeight * 0.1;
				l.selectionEnd = l.getCharacterIndex(p);
			}
			modified = false;
		}

		//removing characters
		if (key === "Backspace" || key === "Delete") {
			if (l.selectionStart === l.selectionEnd) {
				if (key === "Backspace") {
					if (l.selectionEnd) {
						let listValue = l.value.split("");
						listValue.splice(l.selectionEnd - 1, 1);
						l.value = listValue.join("");
						l.selectionEnd--;
					}
				}

				if (key === "Delete") {
					if (l.selectionEnd < l.value.length) {
						let listValue = l.value.split("");
						listValue.splice(l.selectionEnd, 1);
						l.value = listValue.join("");
					}
				}
				l.selectionStart = l.selectionEnd;
			} else {
				if (key === "Backspace" || key === "Delete") {
					let listValue = l.value.split("");
					listValue.splice(start, end - start);
					l.value = listValue.join("");
					l.selectionEnd = l.selectionStart = start;
				}
			}
			modified = true;
		}
		if (resetSelection) l.selectAction();

		l.selectionStart = Number.clamp(l.selectionStart, 0, l.value.length);
		l.selectionEnd = Number.clamp(l.selectionEnd, 0, l.value.length);

		return modified;
	},
	clampScrollOffset(l) {
		l.scrollOffset = Vector2.clamp(l.scrollOffset, Vector2.origin, l.relativeTextBoundingBox.max.minus(l.relativeTextViewBox.max));
	},
	updateTextBoundingBox(l) {
		let { width, height } = this;
		let relativeTextViewBox = new Rect(-width / 2 + l.padding, -height / 2 + l.padding, width - l.padding - l.scrollBarSize, height - l.padding - l.scrollBarSize);
		let relativeTextBoundingBox = new Rect(relativeTextViewBox.x, relativeTextViewBox.y, l.font.getTextWidth(l.value), l.font.getTextHeight(l.value));
		let rightOffset = (l.multiline && relativeTextViewBox.height < relativeTextBoundingBox.height) ? l.scrollBarSize : 0;
		let bottomOffset = (l.multiline && relativeTextViewBox.width < relativeTextBoundingBox.width) ? l.scrollBarSize : 0;
		l.relativeTextViewBox = new Rect(relativeTextViewBox.x, relativeTextViewBox.y, width - l.padding * 2 - rightOffset, height - l.padding * 2 - bottomOffset);
		l.relativeTextBoundingBox = new Rect(relativeTextViewBox.x, relativeTextViewBox.y, l.font.getTextWidth(l.value) + l.renderTextOffset.x, l.font.getTextHeight(l.value) + l.renderTextOffset.y);
		l.clampScrollOffset();
	},
	select(l, p, type) {
		l.blurOthers();
		l.focused = true;
		l.keyTimer = 0;
		let lp = this.transform.worldSpaceToModelSpace(p);
		let rtvb = l.relativeTextViewBox;
		let textAreaHitbox = (type === "start") ? 
			rtvb : 
			new Rect(rtvb.x - l.padding, rtvb.y - l.padding, rtvb.width + l.padding * 2, rtvb.height + l.padding * 2);
		if (Geometry.pointInsideRect(lp, textAreaHitbox)) {
			let inx = l.getCharacterIndex(lp.plus(l.scrollOffset).minus(l.renderTextOffset));
			let preStart = l.selectionStart;
			let preEnd = l.selectionEnd;
			if (type === "start") l.selectionStart = l.selectionEnd = inx;
			else l.selectionEnd = inx;
			l.updateTextBoundingBox();
			l.scrollCursorIntoView();
			l.selectAction();
			return { changed: l.selectionStart !== preStart || l.selectionEnd !== preEnd };
		}
		return false;
	},
	scrollCursorIntoView(l) {
		if (l.value.length === 0) return;
		let pos = l.getTextLocation(l.selectionEnd).plus(l.renderTextOffset);
		if ((pos.x - l.relativeTextViewBox.x).equals(l.renderTextOffset.x)) l.scrollOffset.x = 0;
		if ((pos.y - l.relativeTextViewBox.y).equals(l.renderTextOffset.y)) l.scrollOffset.y = 0;
		let inx = Math.max(0, l.selectionEnd - 1);
		let bounds = l.getCharacterHitbox(inx).move(l.renderTextOffset);
		let box = l.relativeTextViewBox;
		let min = box.min.plus(l.scrollOffset);
		let max = box.max.plus(l.scrollOffset);
		if (pos.y < min.y) l.scrollOffset.y = pos.y - box.y;
		if (pos.y + l.font.lineHeight > max.y) l.scrollOffset.y = pos.y - box.y - box.height + l.font.lineHeight;
		if (pos.x < min.x) l.scrollOffset.x = pos.x - box.x;
		if (pos.x + bounds.width > max.x) l.scrollOffset.x = pos.x - box.x - box.width + bounds.width;
		l.clampScrollOffset();
	},
	selectAction(l) {
		if (!l.keepSelection()) l.selectionStart = l.selectionEnd;
	},
	keepSelection(l) {
		return l.keyboard.pressed("Shift") || l.highlighting;
	},
	getMousePosition(l) {
		return (this instanceof UIObject) ? mouse.screen : mouse.world;
	},
	beforeUpdate(l) {
		TEXT_AREA.staticData.anyTextAreaHovered = false;
	},
	afterUpdate(l) {
		l.canvas.cursor = TEXT_AREA.staticData.anyTextAreaHovered ? "text" : "default";
	},
	update(l) {
		let inTextArea = Geometry.pointInsideRect(this.transform.worldSpaceToModelSpace(l.getMousePosition()), l.relativeTextViewBox);

		if (inTextArea) TEXT_AREA.staticData.anyTextAreaHovered = true;

		if (l.mouse.justPressed("Left")) {
			if (inTextArea) l.highlighting = !!l.select(l.getMousePosition(), "start");
			else l.focused = false;
		}

		if (l.mouse.pressed("Left") && l.highlighting) {
			let selection = l.select(l.getMousePosition(), "move"); 
			if (selection && selection.changed) {
				let relativeMousePosition = this.transform.worldSpaceToModelSpace(l.getMousePosition());
				if (relativeMousePosition.x > l.relativeTextViewBox.max.x) l.scrollOffset.x += l.scrollSpeed / 4;
				if (relativeMousePosition.y > l.relativeTextViewBox.max.y) l.scrollOffset.y += l.scrollSpeed / 4;
				if (relativeMousePosition.x < l.relativeTextViewBox.min.x) l.scrollOffset.x -= l.scrollSpeed / 4;
				if (relativeMousePosition.y < l.relativeTextViewBox.min.y) l.scrollOffset.y -= l.scrollSpeed / 4;
			}
		}
		if (l.mouse.released("Left")) l.highlighting = false;
		if (l.focused && l.keyboard.downQueue.length) {
			l.keyTimer = 0;
			for (let key of l.keyboard.downQueue) {
				key = key.text;

				if (key === "Control" || key === "Shift") continue;
				if (keyboard.pressed("Control") && !l.keyboardShortcuts.includes(key.toLowerCase())) continue;

				let inx = l.ignored.indexOf(key);
				if (inx > -1) {
					l.ignoredRemoval[inx] = true;
					continue;
				}
				let inx2 = l.alwaysIgnored.indexOf(key);
				if (inx2 > -1) continue;
				if (key === "Enter") key = "\n";
				if (key === "Tab") key = "\t";

				let modified = l.processKey(key);

				if (modified) l.saveVersion();
				else l.updateVersionSelection();
			}
			l.updateTextBoundingBox();
			l.scrollCursorIntoView();
		}

		//filter disables
		let stillIgnore = [];
		let stillIgnoreRemoval = [];
		for (let i = 0; i < l.ignored.length; i++) {
			let condition = !(l.ignoredRemoval[i] && l.keyboard.released(l.ignored[i]));
			if (condition) {
				stillIgnore.push(l.ignored[i]);
				stillIgnoreRemoval.push(l.ignoredRemoval[i]);
			}
		}
		l.ignored = stillIgnore;
		l.ignoredRemoval = stillIgnoreRemoval;

		l.updateTextBoundingBox();
	},
	draw(l, name, shape) {
		let prevTextMode = l.renderer.textMode;
		l.renderer.textMode = TextMode.TOP_LEFT;

		let rtvb = l.relativeTextViewBox;
		let expand = 1;
		l.renderer.clip().rect(rtvb.x - expand, rtvb.y - expand, rtvb.width + expand * 2, rtvb.height + expand * 2);
		l.renderer.save();
		l.renderer.translate(l.scrollOffset.inverse);
		// renderer.stroke(Color.LIME, 3).rect(l.relativeTextViewBox);
		// renderer.stroke(Color.RED, 3).rect(l.relativeTextBoundingBox);

		let lines = l.value.split("\n");
		let textPos = l.relativeTextViewBox.min;
		let startLine = Math.floor(l.scrollOffset.y / l.font.lineHeight);
		let endLine = Math.min(lines.length, Math.floor(l.relativeTextViewBox.height / l.font.lineHeight) + startLine + 1);
		textPos.y += l.font.lineHeight * startLine;
		for (let i = startLine; i < endLine; i++) {
			l.renderText(lines[i], l.font, textPos, inx => l.getTextLocationColumnRow(inx, i), i);
			textPos.y += l.font.lineHeight;
		}

		if (l.focused) {
			l.renderer.save();
			l.renderer.translate(l.renderTextOffset);
			//highlight
			if (l.selectionStart !== l.selectionEnd) {
				let start = l.selectionStart;
				let end = l.selectionEnd;
				if (start > end) [start, end] = [end, start];
				end = Math.max(end - 1, 0);

				let endWidthMultiple = 1;
				if (l.value[end] === "\n") {
					end++;
					endWidthMultiple = 0;
					if (end >= l.value.length) end--;
				}

				let startBox = l.getCharacterHitbox(start);
				let endBox = l.getCharacterHitbox(end);
				endBox.width *= endWidthMultiple;

				let highlight = l.highlightColor;
				let dy = (endBox.y - startBox.y) / l.font.lineHeight;


				if (dy) {
					const highlightWidth = Math.max(l.relativeTextBoundingBox.width, l.relativeTextViewBox.width);
					l.renderer.draw(highlight).rect(startBox.x, startBox.y, l.relativeTextViewBox.x + highlightWidth - startBox.x, startBox.height);
					l.renderer.draw(highlight).rect(l.relativeTextViewBox.x, endBox.y, endBox.max.x - l.relativeTextViewBox.x, endBox.height);
					if (dy) l.renderer.draw(highlight).rect(l.relativeTextViewBox.x, startBox.max.y, highlightWidth, endBox.y - startBox.max.y);
				} else {
					l.renderer.draw(highlight).rect(startBox.x, startBox.y, endBox.max.x - startBox.x, startBox.height);
				}
			}

			//caret
			l.keyTimer++;
			let cursorPos = l.getTextLocation(l.selectionEnd);
			if (Math.sin(l.keyTimer * 0.1) > 0) l.renderer.stroke(l.caretColor, 2).line(cursorPos, cursorPos.plus(new Vector2(0, l.font.lineHeight)));
			
			l.renderer.restore();
		}
		l.renderer.restore();
		l.renderer.unclip();


		//X Bar Values
		let xFullSize = l.relativeTextBoundingBox.width;
		let xViewSize = l.relativeTextViewBox.width;
		let xRatio = xViewSize / xFullSize;


		// Y Bar Values
		let yFullSize = l.relativeTextBoundingBox.height;
		let yViewSize = l.relativeTextViewBox.height;
		let yRatio = yViewSize / yFullSize;
		let { width, height } = this;

		//fullDims

		let fullScrollWidth = width - l.scrollBarSize;
		let fullScrollHeight = height - l.scrollBarSize;

		let xs = xRatio < 1;
		let ys = yRatio < 1;
		if (xs && ys) fullScrollHeight = height;
		if (xs && !ys) fullScrollWidth = width;
		if (!xs && ys) fullScrollHeight = height;

		let localMouse = this.transform.worldSpaceToModelSpace(l.getMousePosition());

		if (xs) {
			if (l.multiline) {
				//X Bar Drag
				let thumbX = new Rect(-width / 2 + fullScrollWidth * l.scrollOffset.x / xFullSize, height / 2 - l.scrollBarSize, fullScrollWidth * xRatio, l.scrollBarSize);
				let barX = new Rect(-width / 2, height / 2 - l.scrollBarSize, fullScrollWidth, l.scrollBarSize);
				if (!l.highlighting && l.mouse.pressed("Left") && Geometry.pointInsideRect(localMouse, barX)) {
					l.scrollOffset.x = Number.clamp(xFullSize * (localMouse.x - thumbX.width / 2 + width / 2) / fullScrollWidth, 0, xFullSize - xViewSize);
				}
				l.renderer.draw(Color.LIGHT_GRAY).rect(barX);
				l.renderer.draw(Color.GRAY).rect(thumbX);
				l.renderer.stroke(Color.BLACK).rect(barX);
			}
		} else l.scrollOffset.x = 0;

		if (ys) {
			if (l.multiline) {
				//Y Bar Drag
				let thumbY = new Rect(width / 2 - l.scrollBarSize, -height / 2 + fullScrollHeight * l.scrollOffset.y / yFullSize, l.scrollBarSize, fullScrollHeight * yRatio);
				let barY = new Rect(width / 2 - l.scrollBarSize, -height / 2, l.scrollBarSize, fullScrollHeight);
				if (!l.highlighting && l.mouse.pressed("Left") && Geometry.pointInsideRect(localMouse, barY)) {
					l.scrollOffset.y = Number.clamp(yFullSize * (localMouse.y - thumbY.height / 2 + height / 2) / fullScrollHeight, 0, yFullSize - yViewSize);
				}

				l.renderer.draw(Color.LIGHT_GRAY).rect(barY);
				l.renderer.draw(Color.GRAY).rect(thumbY);
				l.renderer.stroke(Color.BLACK).rect(barY);
			}
		} else l.scrollOffset.y = 0;

		l.renderer.textMode = prevTextMode;
	}
});
TEXT_AREA.staticData.anyTextAreaHovered = false;