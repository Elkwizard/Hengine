class TEXT_AREA extends ElementScript {
	init(obj, font, paddingEM = 0.5, multiline = true, renderText = (text, font, pos, getLoc, lineIndex) => this.renderer.draw(Color.BLACK).text(font, text, pos)) {
		obj.engine.scene.mouseEvents = true;
		this.renderer = obj.engine.renderer;
		this.keyboard = obj.engine.keyboard;
		this.clipboard = obj.engine.clipboard;
		this.canvas = obj.engine.canvas;
		this.mouse = obj.engine.mouse;
		this.focused = false;
		this.value = "";
		this.font = font;
		this.caretColor = Color.BLACK;
		this.highlightColor = new Color(10, 10, 255, 0.2);
		this.multiline = multiline;
		this.renderText = renderText;
		this.renderTextOffset = Vector2.origin;
		this.selectionStart = 0;
		this.selectionEnd = 0;

		this.padding = paddingEM * this.font.size;
		this.scrollBarSize = 15;
		this.scrollSpeed = 20;
		this.scrollOffset = Vector2.origin;
		this.updateTextBoundingBox();

		this.keyboardShortcuts = ["a", "z", "c", "v", "x", "arrowleft", "arrowright"];

		this.keyTimer = 0;
		this.highlighting = false;
		this.clickTimer = 0;
		this.ignored = [];
		this.ignoredRemoval = [];
		this.alwaysIgnored = [];
		this.versions = [];
	}
	saveVersion(obj) {
		this.versions.push({ start: this.selectionStart, end: this.selectionEnd, value: this.value });
	}
	updateVersionSelection(obj) {
		this.versions[this.versions.length - 1].start = this.selectionStart;
		this.versions[this.versions.length - 1].end = this.selectionEnd;
	}
	ignore(obj, key) {
		this.ignored.push(key);
		this.ignoredRemoval.push(false);
	}
	alwaysIgnore(obj, key) {
		this.alwaysIgnored.push(key);
	}
	getValue(obj) {
		return this.value;
	}
	setValue(obj, value) {
		value += "";
		this.value = "";
		for (let i = 0; i < value.length; i++) {
			this.processKey(value[i]);
		}
		this.updateTextBoundingBox();
		this.saveVersion();
	}
	blurOthers(obj) {
		const elements = obj.engine.scene.main.getElementsWithScript(TEXT_AREA);
		for (let i = 0; i < elements.length; i++) elements[i].scripts.TEXT_AREA.blur();
	}
	focus(obj) {
		this.blurOthers();

		this.focused = true;
		this.selectionStart = this.value.length;
		this.selectionEnd = this.value.length;
	}
	blur(obj) {
		this.focused = false;
	}
	selectRange(obj, min, max) {
		min = Math.max(min, 0);
		max = Math.min(max, this.value.length);
		this.selectionStart = min;
		this.selectionEnd = max;
	}
	getCharacterIndex(obj, p) {
		let hitboxGroups = this.value.split("\n");
		hitboxGroups[0] = {
			array: hitboxGroups[0],
			startInx: 0
		};
		for (let i = 1; i < hitboxGroups.length; i++)
			hitboxGroups[i] = {
				array: hitboxGroups[i],
				startInx: hitboxGroups[i - 1].startInx + hitboxGroups[i - 1].array.length + 1
			};


		let index = 0;
		const yRow = Math.floor((p.y - this.relativeTextViewBox.y) / this.font.lineHeight);
		if (yRow >= hitboxGroups.length) index = this.value.length;
		else if (yRow >= 0) {
			let { startInx, array } = hitboxGroups[yRow];
			array = array.split("").map((char, i) => this.getCharacterHitbox(i + startInx));
			index = (p.x < this.relativeTextViewBox.x) ? startInx : startInx + array.length;
			for (let i = 0; i < array.length; i++) {
				const rect = array[i];
				if (Geometry.pointInsideRect(p, rect)) {
					const rx = (p.x - rect.x) / rect.width;
					return startInx + i + Math.round(rx);
				}
			}
		}
		return index;
	}
	getCharacterHitbox(obj, index) {
		let cursorPos = this.getTextLocation(index);
		let box = new Rect(cursorPos.x, cursorPos.y, this.font.getTextLineWidth(this.value[index]), this.font.lineHeight);
		return box;
	}
	getTextLocation(obj, index) {
		let value = this.value.slice(0, index);
		let lines = value.split("\n");
		let y = lines.length * this.font.lineHeight;
		let line = lines[lines.length - 1];
		let x = this.font.getTextLineWidth(line);
		let pos = new Vector2(x + this.relativeTextViewBox.x, y + this.relativeTextViewBox.y - this.font.lineHeight);
		return pos;
	}
	getTextLocationColumnRow(obj, column, row) {
		let y = this.font.lineHeight * (row + 1);
		let lines = this.value.split("\n");
		let line = lines[row].slice(0, column);
		let x = this.font.getTextLineWidth(line);
		let pos = new Vector2(x + this.relativeTextViewBox.x, y + this.relativeTextViewBox.y - this.font.lineHeight);
		return pos;
	}
	processKey(obj, key) {
		//adding characters
		let modified = true;

		let start = Math.min(this.selectionStart, this.selectionEnd);
		let end = Math.max(this.selectionStart, this.selectionEnd);

		let control = this.keyboard.pressed("Control");
		let shift = this.keyboard.pressed("Shift");
		let resetSelection = !((control && !(key === "ArrowLeft" || key === "ArrowRight")) || shift);
		if (key.length === 1) {
			if (control && key.toLowerCase() === "a") {
				this.selectionStart = 0;
				this.selectionEnd = this.value.length;
				modified = false;
			} else {
				let newChar = key;
				let paste = key.toLowerCase() === "v" && control;
				let copy = key.toLowerCase() === "c" && control;
				let cut = key.toLowerCase() === "x" && control;
				let undo = key.toLowerCase() === "z" && control;
				if (undo) {
					if (this.versions.length >= 2) {
						this.versions.pop();
						let state = this.versions[this.versions.length - 1];
						this.selectionStart = state.start;
						this.selectionEnd = state.end;
						this.value = state.value;
						modified = false;
					}
				} else {
					if (copy || cut) this.clipboard.write(this.value.slice(start, end));
					if (!copy) {
						if (paste) newChar = this.clipboard.read();
						if (cut) newChar = "";

						newChar = this.multiline ? newChar : newChar.replace(/[\n\r]/g, ""); // sanitize (remove line breaks in single line TEXT_AREAs)

						let listValue = this.value.split("");
						listValue.splice(start, end - start, newChar);
						this.value = listValue.join("");
						this.selectionEnd = start + newChar.length;
						this.selectionStart = this.selectionEnd;
						if (paste) this.selectionStart = this.selectionEnd = start + newChar.length;
						modified = true;
					} else modified = false;
				}
			}
		}


		//arrow keys
		if (key.slice(0, 5) === "Arrow") {
			if (this.selectionEnd === this.selectionStart || shift) {
				if (control) {
					const segments = this.getSelectableSegments();
					let index = 0;
					for (let i = 0; i < segments.length; i++) {
						const seg = segments[i];
						if (key === "ArrowRight") {
							if (index <= this.selectionEnd && this.selectionEnd < index + seg.length) {
								this.selectionEnd = index + seg.length;
								break;
							}
						} else if (key === "ArrowLeft") {
							if (index < this.selectionEnd && this.selectionEnd <= index + seg.length) {
								this.selectionEnd = index;
								break;
							}
						}
						index += seg.length;
					}
				} else {
					if (key === "ArrowLeft") this.selectionEnd--;
					else if (key === "ArrowRight") this.selectionEnd++;
				}
			} else {
				if (key === "ArrowLeft") this.selectionEnd = this.selectionStart = start;
				else if (key === "ArrowRight") this.selectionEnd = this.selectionStart = end;
			}
			if (key === "ArrowUp" || key === "ArrowDown") {
				let p = this.getTextLocation(this.selectionEnd);
				p.y += ((key === "ArrowUp") ? -0.5 : 1.5) * this.font.lineHeight;
				p.x += this.font.lineHeight * 0.1;
				this.selectionEnd = this.getCharacterIndex(p);
			}
			modified = false;
		}

		//removing characters
		if (key === "Backspace" || key === "Delete") {
			if (this.selectionStart === this.selectionEnd) {
				if (key === "Backspace") {
					if (this.selectionEnd) {
						let listValue = this.value.split("");
						listValue.splice(this.selectionEnd - 1, 1);
						this.value = listValue.join("");
						this.selectionEnd--;
					}
				}

				if (key === "Delete") {
					if (this.selectionEnd < this.value.length) {
						let listValue = this.value.split("");
						listValue.splice(this.selectionEnd, 1);
						this.value = listValue.join("");
					}
				}
				this.selectionStart = this.selectionEnd;
			} else {
				if (key === "Backspace" || key === "Delete") {
					let listValue = this.value.split("");
					listValue.splice(start, end - start);
					this.value = listValue.join("");
					this.selectionEnd = this.selectionStart = start;
				}
			}
			modified = true;
		}
		if (resetSelection) this.selectAction();

		this.selectionStart = Number.clamp(this.selectionStart, 0, this.value.length);
		this.selectionEnd = Number.clamp(this.selectionEnd, 0, this.value.length);

		return modified;
	}
	clampScrollOffset(obj) {
		this.scrollOffset = Vector2.clamp(
			this.scrollOffset,
			Vector2.origin,
			this.relativeTextBoundingBox.max.minus(this.relativeTextViewBox.max)
		);
	}
	getDimensions(obj) {
		return obj.defaultShape.getBoundingBox();
	}
	updateTextBoundingBox(obj) {
		const { width, height } = this.getDimensions();
		const relativeTextViewBox = new Rect(-width / 2 + this.padding, -height / 2 + this.padding, width - this.padding - this.scrollBarSize, height - this.padding - this.scrollBarSize);
		const relativeTextBoundingBox = new Rect(relativeTextViewBox.x, relativeTextViewBox.y, this.font.getTextWidth(this.value), this.font.getTextHeight(this.value));
		const rightOffset = (this.multiline && relativeTextViewBox.height < relativeTextBoundingBox.height) ? this.scrollBarSize : 0;
		const bottomOffset = (this.multiline && relativeTextViewBox.width < relativeTextBoundingBox.width) ? this.scrollBarSize : 0;
		this.relativeTextViewBox = new Rect(relativeTextViewBox.x, relativeTextViewBox.y, width - this.padding * 2 - rightOffset, height - this.padding * 2 - bottomOffset);
		this.relativeTextBoundingBox = new Rect(relativeTextViewBox.x, relativeTextViewBox.y, this.font.getTextWidth(this.value) + this.renderTextOffset.x, this.font.getTextHeight(this.value) + this.renderTextOffset.y);
		this.clampScrollOffset();
	}
	select(obj, p, type) {
		this.blurOthers();
		this.focused = true;
		this.keyTimer = 0;
		let lp = obj.transform.globalSpaceToLocalSpace(p);
		const rtvb = this.relativeTextViewBox;
		const textAreaHitbox = (type === "start") ?
			rtvb :
			new Rect(rtvb.x - this.padding, rtvb.y - this.padding, rtvb.width + this.padding * 2, rtvb.height + this.padding * 2);
		if (Geometry.pointInsideRect(lp, textAreaHitbox) || type === "move") {
			if (type === "move")
				lp = Vector2.clamp(lp, textAreaHitbox.min, textAreaHitbox.max);
			const inx = this.getCharacterIndex(lp.plus(this.scrollOffset).minus(this.renderTextOffset));
			const preStart = this.selectionStart;
			const preEnd = this.selectionEnd;
			if (type === "start") this.selectionStart = this.selectionEnd = inx;
			else this.selectionEnd = inx;
			this.updateTextBoundingBox();
			this.scrollCursorIntoView();
			this.selectAction();
			return { changed: this.selectionStart !== preStart || this.selectionEnd !== preEnd };
		}
		return null;
	}
	scrollCursorIntoView(obj) {
		if (this.value.length === 0) return;
		let pos = this.getTextLocation(this.selectionEnd).plus(this.renderTextOffset);
		if ((pos.x - this.relativeTextViewBox.x).equals(this.renderTextOffset.x)) this.scrollOffset.x = 0;
		if ((pos.y - this.relativeTextViewBox.y).equals(this.renderTextOffset.y)) this.scrollOffset.y = 0;
		let inx = Math.max(0, this.selectionEnd - 1);
		let bounds = this.getCharacterHitbox(inx).move(this.renderTextOffset);
		let box = this.relativeTextViewBox;
		let min = box.min.plus(this.scrollOffset);
		let max = box.max.plus(this.scrollOffset);
		if (pos.y < min.y) this.scrollOffset.y = pos.y - box.y;
		if (pos.y + this.font.lineHeight > max.y) this.scrollOffset.y = pos.y - box.y - box.height + this.font.lineHeight;
		if (pos.x < min.x) this.scrollOffset.x = pos.x - box.x;
		if (pos.x + bounds.width > max.x) this.scrollOffset.x = pos.x - box.x - box.width + bounds.width;
		this.clampScrollOffset();
	}
	selectAction(obj) {
		if (!this.keepSelection()) this.selectionStart = this.selectionEnd;
	}
	keepSelection(obj) {
		return this.keyboard.pressed("Shift") || this.highlighting;
	}
	getMousePosition(obj) {
		return (obj instanceof UIObject) ? this.mouse.screen : this.mouse.world;
	}
	getSelectableSegments(obj) {
		const segments = [];
		let acc = "";

		const type = char => {
			if (char === "\n") return 0;
			if (char.match(/\s/g)) return 1;
			if (char.match(/\W/g)) return 2;
			return 3;
		}

		for (let i = 0; i < this.value.length; i++) {
			const char = this.value[i];
			const next = this.value[i + 1];
			acc += char;
			if (!next || type(char) !== type(next)) {
				segments.push(acc);
				acc = "";
			}
		}

		return segments;
	}
	adjustCursor(obj) {
		const { anyTextAreaHovered } = TEXT_AREA;
		if (!anyTextAreaHovered && this.canvas.cursor === "text") this.canvas.cursor = "default";
		if (anyTextAreaHovered) this.canvas.cursor = "text";
	}
	beforeUpdate(obj) {
		TEXT_AREA.anyTextAreaHovered = false;
	}
	afterUpdate(obj) {
		this.adjustCursor();
	}
	cleanUp() {
		this.adjustCursor();
	}
	deactivate() {
		this.adjustCursor();
	}
	update(obj) {
		// scroll wheel
		if (this.mouse.wheelDelta !== 0) {
			if (obj.hovered) {
				this.scrollOffset.y += Math.sign(this.mouse.wheelDelta) * this.scrollSpeed;
				this.clampScrollOffset();
			}
		}

		let inTextArea = Geometry.pointInsideRect(obj.transform.globalSpaceToLocalSpace(this.getMousePosition()), this.relativeTextViewBox);
		if (inTextArea) TEXT_AREA.anyTextAreaHovered = true;

		const doubleClick = this.mouse.justPressed("Left") && this.clickTimer < 15 && inTextArea;

		const lastSelection = this.selectionEnd;

		if (this.mouse.justPressed("Left")) {
			if (inTextArea) {
				this.highlighting = !!this.select(this.getMousePosition(), "start") && !doubleClick;
			} else this.focused = false;
		}

		if (this.mouse.pressed("Left") && this.highlighting) {
			const selection = this.select(this.getMousePosition(), "move");
			if (selection && !selection.changed) {
				const relativeMousePosition = obj.transform.globalSpaceToLocalSpace(this.getMousePosition());
				if (relativeMousePosition.x > this.relativeTextViewBox.max.x) this.scrollOffset.x += this.scrollSpeed;
				if (relativeMousePosition.y > this.relativeTextViewBox.max.y) this.scrollOffset.y += this.scrollSpeed;
				if (relativeMousePosition.x < this.relativeTextViewBox.min.x) this.scrollOffset.x -= this.scrollSpeed;
				if (relativeMousePosition.y < this.relativeTextViewBox.min.y) this.scrollOffset.y -= this.scrollSpeed;
			}
		}
		if (this.mouse.released("Left")) this.highlighting = false;

		if (doubleClick && this.selectionEnd === lastSelection) {
			const segments = this.getSelectableSegments();
			let index = 0;
			for (let i = 0; i < segments.length; i++) {
				const seg = segments[i];
				if (index <= this.selectionEnd && this.selectionEnd < index + seg.length) {
					this.selectionStart = index;
					this.selectionEnd = index + seg.length;
					break;
				}
				index += seg.length;
			}
			this.clickTimer = Infinity;
		}

		if (this.mouse.justPressed("Left") && !doubleClick) this.clickTimer = 0;
		this.clickTimer++;

		const queue = this.keyboard.downQueue;
		if (this.focused && queue.length) {
			this.keyTimer = 0;
			for (let key of queue) {

				if (key === "Control" || key === "Shift") continue;
				if (keyboard.pressed("Control") && !this.keyboardShortcuts.includes(key.toLowerCase())) continue;

				let inx = this.ignored.indexOf(key);
				if (inx > -1) {
					this.ignoredRemoval[inx] = true;
					continue;
				}
				let inx2 = this.alwaysIgnored.indexOf(key);
				if (inx2 > -1) continue;
				if (key === "Enter") key = "\n";
				if (key === "Tab") key = "\t";

				let modified = this.processKey(key);

				if (modified) this.saveVersion();
				else this.updateVersionSelection();
			}
			this.updateTextBoundingBox();
			this.scrollCursorIntoView();
		}

		//filter disables
		let stillIgnore = [];
		let stillIgnoreRemoval = [];
		for (let i = 0; i < this.ignored.length; i++) {
			let condition = !(this.ignoredRemoval[i] && this.keyboard.released(this.ignored[i]));
			if (condition) {
				stillIgnore.push(this.ignored[i]);
				stillIgnoreRemoval.push(this.ignoredRemoval[i]);
			}
		}
		this.ignored = stillIgnore;
		this.ignoredRemoval = stillIgnoreRemoval;

		this.updateTextBoundingBox();
	}
	draw(obj, name, shape) {
		let prevTextMode = this.renderer.textMode;
		this.renderer.textMode = TextMode.TOP_LEFT;

		let rtvb = this.relativeTextViewBox;
		let expand = 1;
		this.renderer.clip().rect(rtvb.x - expand, rtvb.y - expand, rtvb.width + expand * 2, rtvb.height + expand * 2);
		this.renderer.save();
		this.renderer.translate(this.scrollOffset.inverse);

		let lines = this.value.split("\n");
		let textPos = this.relativeTextViewBox.min;
		let startLine = Math.floor(this.scrollOffset.y / this.font.lineHeight);
		let endLine = Math.min(lines.length, Math.floor(this.relativeTextViewBox.height / this.font.lineHeight) + startLine + 1);
		textPos.y += this.font.lineHeight * startLine;
		for (let i = startLine; i < endLine; i++) {
			this.renderText(lines[i], this.font, textPos, inx => this.getTextLocationColumnRow(inx, i), i);
			textPos.y += this.font.lineHeight;
		}

		if (this.focused) {
			this.renderer.save();
			this.renderer.translate(this.renderTextOffset);
			//highlight
			if (this.selectionStart !== this.selectionEnd) {
				let start = this.selectionStart;
				let end = this.selectionEnd;
				if (start > end) [start, end] = [end, start];
				end = Math.max(end - 1, 0);

				let endWidthMultiple = 1;
				if (this.value[end] === "\n") {
					end++;
					endWidthMultiple = 0;
					if (end >= this.value.length) end--;
				}

				let startBox = this.getCharacterHitbox(start);
				let endBox = this.getCharacterHitbox(end);
				endBox.width *= endWidthMultiple;

				let highlight = this.highlightColor;
				let dy = (endBox.y - startBox.y) / this.font.lineHeight;


				if (dy) {
					const highlightWidth = Math.max(this.relativeTextBoundingBox.width, this.relativeTextViewBox.width);
					this.renderer.draw(highlight).rect(startBox.x, startBox.y, this.relativeTextViewBox.x + highlightWidth - startBox.x, startBox.height);
					this.renderer.draw(highlight).rect(this.relativeTextViewBox.x, endBox.y, endBox.max.x - this.relativeTextViewBox.x, endBox.height);
					if (dy) this.renderer.draw(highlight).rect(this.relativeTextViewBox.x, startBox.max.y, highlightWidth, endBox.y - startBox.max.y);
				} else {
					this.renderer.draw(highlight).rect(startBox.x, startBox.y, endBox.max.x - startBox.x, startBox.height);
				}
			}

			//caret
			this.keyTimer++;
			let cursorPos = this.getTextLocation(this.selectionEnd);
			if (Math.sin(this.keyTimer * 0.1) > 0) this.renderer.stroke(this.caretColor, 2).line(cursorPos, cursorPos.plus(new Vector2(0, this.font.lineHeight)));

			this.renderer.restore();
		}
		this.renderer.restore();
		this.renderer.unclip();


		// x bar Values
		const xFullSize = this.relativeTextBoundingBox.width;
		const xViewSize = this.relativeTextViewBox.width;
		const xRatio = xViewSize / xFullSize;


		// y bar Values
		const yFullSize = this.relativeTextBoundingBox.height;
		const yViewSize = this.relativeTextViewBox.height;
		const yRatio = yViewSize / yFullSize;

		// full dimensions
		const { width, height } = this.getDimensions();
		let fullScrollWidth = width - this.scrollBarSize;
		let fullScrollHeight = height - this.scrollBarSize;

		let xs = xRatio < 1;
		let ys = yRatio < 1;
		if (xs && ys) fullScrollHeight = height;
		if (xs && !ys) fullScrollWidth = width;
		if (!xs && ys) fullScrollHeight = height;

		let localMouse = obj.transform.globalSpaceToLocalSpace(this.getMousePosition());

		if (xs) {
			if (this.multiline) {
				//X Bar Drag
				let thumbX = new Rect(-width / 2 + fullScrollWidth * this.scrollOffset.x / xFullSize, height / 2 - this.scrollBarSize, fullScrollWidth * xRatio, this.scrollBarSize);
				let barX = new Rect(-width / 2, height / 2 - this.scrollBarSize, fullScrollWidth, this.scrollBarSize);
				if (!this.highlighting && this.mouse.pressed("Left") && Geometry.pointInsideRect(localMouse, barX)) {
					this.scrollOffset.x = Number.clamp(xFullSize * (localMouse.x - thumbX.width / 2 + width / 2) / fullScrollWidth, 0, xFullSize - xViewSize);
				}
				this.renderer.draw(Color.LIGHT_GRAY).rect(barX);
				this.renderer.draw(Color.GRAY).rect(thumbX);
				this.renderer.stroke(Color.BLACK).rect(barX);
			}
		} else this.scrollOffset.x = 0;

		if (ys) {
			if (this.multiline) {
				//Y Bar Drag
				let thumbY = new Rect(width / 2 - this.scrollBarSize, -height / 2 + fullScrollHeight * this.scrollOffset.y / yFullSize, this.scrollBarSize, fullScrollHeight * yRatio);
				let barY = new Rect(width / 2 - this.scrollBarSize, -height / 2, this.scrollBarSize, fullScrollHeight);
				if (!this.highlighting && this.mouse.pressed("Left") && Geometry.pointInsideRect(localMouse, barY)) {
					this.scrollOffset.y = Number.clamp(yFullSize * (localMouse.y - thumbY.height / 2 + height / 2) / fullScrollHeight, 0, yFullSize - yViewSize);
				}

				this.renderer.draw(Color.LIGHT_GRAY).rect(barY);
				this.renderer.draw(Color.GRAY).rect(thumbY);
				this.renderer.stroke(Color.BLACK).rect(barY);
			}
		} else this.scrollOffset.y = 0;

		this.renderer.textMode = prevTextMode;
	}
}
TEXT_AREA.anyTextAreaHovered = false;