/**
 * Properties
 * Since 2013-11-19 07:43:37
 * @author bitchunk
 */

//canvas
var VIEWMULTI = 2;//キャンバス基本サイズ拡大倍数
var CHIPCELL_SIZE = 8;//基本サイズ1辺り 8*8
var DISPLAY_WIDTH = 256;//キャンバス表示基本幅
var DISPLAY_HEIGHT = 240;//キャンバス表示基本高
var UI_SCREEN_ID = 'screen'; //イベント取得・拡大表示用

var SCROLL_MAX_SPRITES_DRAW = 32; //スプライト最大描画数
var SCROLL_MAX_SPRITES_STACK = 2048; //スプライト最大スタック数

var IMAGE_DIR = './img/'; //画像ファイル読み込みパス(URLフルパスも可)

//wordprint

var WORDPRINT_FONT8PX = 'font8p';
var WORDPRINT_FONT4V6PX = 'font4v6p';
var WORDPRINT_FONT12PX = 'font12p';



//keyevent
var KEYCONTROLL_HOLDTIME = 16; //キー固定判定時間[fps]


var app;
var cto = cellhto;
var SCROLL = null;
var MR = makeRect;

function SpriteQueryBuilder(){
	return;
}
SpriteQueryBuilder.prototype = {
	init: function(){
		this.uiSpriteName = 'sprites';
		this.sprites = {};
		this.appClock = 0;
		this.fileHover = false;
		this.word8;
		this.keyControll = new KeyControll();
		this.ppControll = new PointingControll();
		this.cpControll = new PointingControll();
		this.bgPos = {x: 0, y: 0};
		this.colorSwap = false;
		this.reverseEnable = true;
		this.boost = false;
		this.loadedSprite;
		this.selectedCells = [];
		this.selectedSprites;
		this.selectedSpritesBg;
		this.isLoaded = false;
		this.paletteSelect = {start: {x: -1, y: -1}, end: {x: -1, y: -1}, move: {x: -1, y: -1}};
		this.bgPaletteId = -1;
		
		this.ease = new Ease();
		
		this.isPaletteDisplay = true;
		this.paletteSlideAlign = 0;
		
		this.isContains = {
			bgPalette: false,
			selectedPalette: false,
		};
		
		this.cursor = {
			palette: {x: 0, y: 0},
		};
		this.cellrects = {
			bgSelected: MR('0 0 1 1'),
			paletteSelected: MR('0 0 1 1'),
		};
		
		this.rects = {
			loadedSpriteFrame: MR('2 2 18 18 *8'),
			spritePalette: MR('3 3 16 16 *8'),
			bgPalette: MR('16 21 3 3 *8'),
			selectPalette: MR('3 21 8 8 *8'),
		};
		this.margin = {
			loadedSpriteFrame: {x: cto(2), y: cto(2)},
			spritePalette: {x: cto(3), y: cto(3)},
			bgPalette: {x: cto(15	), y: cto(20)},
			selectPalette: {x: cto(2), y: cto(20)},
			slidePalette: {x: cto(19), y: 0},
		};
		
		var self = this, img;
		
 		//スプライトキャンバス
 		makeScroll('bg1', false);
		//スプライトパレット
		makeScroll('bg2', false);
 		//ウィンドウ　上：スプライトブラシ
		makeScroll('bg3', false);
		//選択中エフェクト
		makeScroll('sprite', false);
		makeScroll('tmp', false);
		makeScroll('screen', true);
		
		SCROLL = getScrolls();
		
		imageDropFileHandle(scrollByName('screen').canvas, function(img){
			self.openSpriteImage(img);
		});
		
		loadImages([['sprites', 8, 8]], function(){
			//TODO test sprite
			img = new Image();
			img.src = './img/sprites.png';
			img.onload = function(){
				self.openSpriteImage(this);
			};
			
			self.keyControll.initDefaultKey();
			self.keyControll.setKey('ext', 16);
			self.ppControll.init(scrollByName('screen'), scrollByName('bg3'));
			self.cpControll.init(scrollByName('screen'), scrollByName('bg1'));

			self.initSprites();
			self.initDrawBG();
			requestAnimationFrame(main);
			
			//TODO test
			// self.setMouseEventPalette();
			// self.setMouseEventBgPalette();

		});
	},
	
	initSprites: function(){
		var self = this
			, k, spr
			, swap = swapColorSpriteRecursive
			, ms = function(id, opt){
				// var con = (id == null || opt == null) ? '' : '|';
				id = id == null ? '' : id;
				opt = opt == null ? '' : opt;
			return makeSpriteQuery(self.uiSpriteName, id + opt);
			}
		;
		this.sprites = {
			select_tl: ms(0),
			select_tc: ms(1),
			select_tr: ms(0, '|fh'),
			select_ml: ms(1, '|r3'),
			select_mr: ms(1, '|r1'),
			select_bl: ms(0, '|fv'),
			select_bc: ms(1, '|fv'),
			select_br: ms(0, '|fvh'),
			select_single: ms(2),
			select_pipe_h: ms(3),
			select_pipe_v: ms(null, '3|r1'),
			select_cup_t: ms(8),
			select_cup_r: ms(null, '8|r1'),
			select_cup_b: ms(null, '8|r2'),
			select_cup_l: ms(null, '8|r3'),
			select_bgPalette: ms(5),
			
			blankbg: ms(9, '*32^30'),
			separate: ms(4, '^30'),
			bg_white: ms(5, '*31^30'),
			frame_loaded: ms(null, '6 7*16 6|fh;(7|r3 63*16 7|r1)^16!;6|fv 7|fv*16 6|fvh'),
			frame_bgPalette: ms(null, '6 7*3 6|fh;(7|r3 63*3 7|r1)^3!;6|fv 7|fv*3 6|fvh'),
			frame_selPalette: ms(null, '6 7*8 6|fh;(7|r3 63*8 7|r1)^8!;6|fv 7|fv*8 6|fvh'),
			icon_upload: ms(null, '0+2:6+2'),
			arrow_u: ms(58),
			cursor: ms(5),
		};
		
		for(k in this.sprites){
			if(k.search(/^select_\w*/) == -1){
				continue;
			}
			this.sprites['d1_' + k] = copyCanvasSpriteChunk(this.sprites[k]);
			swap(this.sprites['d1_' + k], 'set', [188, 188, 188, 255], COLOR_WHITE);
			this.sprites['d2_' + k] = copyCanvasSpriteChunk(this.sprites[k]);
			swap(this.sprites['d2_' + k], 'set', [124, 124, 124, 255], COLOR_WHITE);
		}
		
		swap(this.sprites.select_bgPalette, 'set', [0, 0, 252, 255], COLOR_WHITE);
		
	},
	
	initDrawBG: function(){
		var bg1 = SCROLL.bg1
			, bg2 = SCROLL.bg2
			, bg3 = SCROLL.bg3
			, scr = SCROLL.screen
			, framePos = this.margin.loadedSpriteFrame
			, palettePos = this.margin.spritePalette
			, bgpPos = this.margin.bgPalette
			, slpPos = this.margin.selectPalette
			;
			
		bg1.clear(COLOR_BLACK);
		bg1.drawSpriteChunk(this.sprites.blankbg, 0, 0);
		
		bg2.clear(COLOR_BLACK);
		bg2.x = palettePos.x;
		bg2.y = palettePos.y;
		
		bg3.clear();
		bg3.drawSpriteChunk(this.sprites.separate, 0, 0);
		bg3.drawSpriteChunk(this.sprites.bg_white, cto(1), 0);
		bg3.drawSpriteChunk(this.sprites.frame_loaded, framePos.x, framePos.y);
		
		bg3.drawSpriteChunk(this.sprites.frame_bgPalette, bgpPos.x, bgpPos.y);
		bg3.drawSpriteChunk(this.sprites.frame_selPalette, slpPos.x, slpPos.y);
		this.drawWindowBlank();
		
	},
	
	openSpriteImage: function(img){
		var size = getBuildCellSize()
			, res = imageResource
			, r
		;
		this.loadedSprite = {};
		img.name = 'loaded_f';
		res.appendImage(img.name, img, img.width, img.height);
		res.loaded(img);
		img.name = 'loaded_c';
		res.appendImage(img.name, img, size.w, size.h);
		res.loaded(img);
		this.loadedSprite.image = img;
		this.loadedSprite.full = makeSprite('loaded_f', 0);
		this.loadedSprite.palette = null;
		
		this.loadedSprite.rect = MR(0, 0, img.wdth, img.height);
		r = MR(0, 0, tocellh(img.width), tocellh(img.height));
		this.loadedSprite.cellrect = r;
		this.isLoaded = true;
		this.drawLoadedImage();
		
		this.makeSelectedBg((r.w * r.h) - 1);
		this.setBgPalette(MR([r.w - 1, r.h - 1, 1, 1].join(' '))); 
		this.makeSelect();
		// this.makeSelect(MR([r.w - 1, r.h - 1, 1, 1].join(' ') + ' *8'));
		
		this.setMouseEventPalette();
		this.setMouseEventBgPalette();
		this.setMouseEventSelectedSprite();
	},
	
	i2pos: function(id)
	{
		var name = this.loadedSprite.image.name
			, nums = imageCellsNum(name)
		;
		pos = index2Pos(id, nums.w, nums.h);
		return pos;
	},
	
	setMouseEventCanvase: function()
	{
		var r = this.rects.selectPalette
			, self = this
		;
		this.ppControll.appendTappableItem(
			r,null, function(item, x, y){
				self.drawSelectedSprite();
			}
			, 'bgsel'
		);		
		this.ppControll.appendFlickableItem(
			r,
			function(item, x, y){
				self.isContains.spritePalette = true;
			}, function(item, x, y){
				self.isContains.spritePalette = false;
			}
			, 'bgsel'
		);
	},
	
	setMouseEventSelectedSprite: function()
	{
		var r = this.rects.selectPalette
			, self = this
		;
		this.ppControll.appendTappableItem(
			r,null, function(item, x, y){
				self.drawSelectedSprite();
			}
			, 'bgsel'
		);		
		this.ppControll.appendFlickableItem(
			r,
			function(item, x, y){
				self.isContains.spritePalette = true;
			}, function(item, x, y){
				self.isContains.spritePalette = false;
			}
			, 'bgsel'
		);
	},
	
	setMouseEventBgPalette: function()
	{
		var r = this.rects.bgPalette
			, self = this
		;
		this.ppControll.appendTappableItem(
			r,null, function(item, x, y){
				// self.setBgPalette(self.selectedRect);
				self.setBgPalette(self.cellrects.paletteSelected);
				self.drawSelectedBg();
			}
			, 'bgsel'
		);		
		this.ppControll.appendFlickableItem(
			r,
			function(item, x, y){
				self.isContains.bgPalette = true;
			}, function(item, x, y){
				self.isContains.bgPalette = false;
			}
			, 'bgsel'
		);
	},
	
	setMouseEventPalette: function()
	{
		var r = this.rects.spritePalette
			, self = this
			, sel = this.paletteSelect
			, crect
			, rect
		;
		this.ppControll.appendTappableItem(
			r,
			function(item, x, y){
				sel.start.x = x - r.x;
				sel.start.y = y - r.y;
				sel.end.x = -1;
				sel.end.y = -1;
			}, function(item, x, y){
				sel.end.x =  x - r.x;
				sel.end.y =  y - r.y;
				self.makeSelect(sel.start.x, sel.start.y, sel.end.x, sel.end.y);
				
				crect = self.cellrects.paletteSelected;
				rect = self.loadedSprite.cellrect;
				self.makeSelectedBg(crect.x + (crect.y * rect.w));
			}
			, 'palletsel'
		);
		this.ppControll.appendFlickableItem(
			r,
			function(item, x, y){
				sel.move.x =  x - r.x;
				sel.move.y =  y - r.y;
			}, function(item, x, y){
				sel.move.x = -1;
				sel.move.y = -1;
			}
			, 'palletsel'
		);
	},
	
	setPaletteSlide: function(pat){
		var targetPos = ([
			0,
			this.margin.slidePalette.x,
			DISPLAY_WIDTH
		])[pat]
		;
		this.ease.swing(SCROLL.bg3.x, targetPos, 16);
	},
	
	/**
	 * 背景パレットを決定する
	 * @param {Rect(cell)} cellrect
	 */
	setBgPalette: function(cellrect){
		this.bgPaletteId = cellrect.x + (cellrect.y * cellrect.w);
		this.cellrects.bgSelected = MR(cellrect.x, cellrect.y, cellrect.w, cellrect.h);
		this.drawBgPaletteCursor();
	},
	
	/**
	 * 背景パレットを用意する
	 * @param {integer} id
	 */
	makeSelectedBg: function(id)
	{
		this.selectedSpritesBg = makeSpriteQuery(this.loadedSprite.image.name, '' + id + '*3^3');
	},
	
	/**
	 * 選択したパレットを作成する
	 */
	makeSelect: function(sx, sy, ex, ey){
		var img = this.loadedSprite.image
			, pw = img.width
			, ph = img.height
			, sel = this.paletteSelect
			, size = getBuildCellSize()
			, q = '', sr
			, x, y, id
			;
		sx = sx == null ? sel.start.x : sx;
		sy = sy == null ? sel.start.y : sy;
		ex = ex == null ? sel.end.x : ex;
		ey = ey == null ? sel.end.y : ey;
		
		selectedCells = [];
		for(y = sy; y < ey; y += size.h){
			for(x = sx; x < ex; x += size.w){
				id =tocellh(x) + (tocellh(y) * tocellh(pw));
				this.selectedCells.push(id);
			}
		}
		sr = MR([tocellh(sx), tocellh(sy), tocellh(ex), tocellh(ey)].join(' ') + ' :pos');
		this.cellrects.paletteSelected = sr;
		
		q = '' + sr.x + '+' + sr.w + ':' + sr.y + '+' + sr.h;
		
		this.selectedSprites = makeSpriteQuery(img.name, q);
	},

	//Repeat Draw
	drawPaletteCursor: function(){
		var tpos = this.ppControll.tapMovePos
			, bg3 = SCROLL.bg3
			, r = this.rects.spritePalette
		;
		if(this.appClock % 2 == 0){
			return;
		}
		if(r.isContain(tpos.x, tpos.y) == false){
			return;
		}
		
		SCROLL.sprite.drawSpriteChunk(this.sprites.cursor, parseCell(bg3.x + tpos.x), parseCell(bg3.y + tpos.y));
	},
	
	drawCanvasCursor: function(){
		var tpos = this.cpControll.tapMovePos
			, cv1 = SCROLL.bg1.canvas
			, cv3 = SCROLL.bg3.canvas
			, r = MR(0, 0, cv1.width, cv1.height)
			, bgr = MR(SCROLL.bg3.x, 0, cv3.width, cv3.height)
		;
		if(this.appClock % 2 == 0){
			return;
		}
		if(r.isContain(tpos.x, tpos.y) == false || bgr.isContain(tpos.x, tpos.y)){
			return;
		}
		
		SCROLL.sprite.drawSpriteChunk(this.sprites.cursor, parseCell(tpos.x), parseCell(tpos.y));
	},
	
	drawSelectedRange: function()
	{
		var tpos = this.ppControll.tapMovePos
			, spr, scr = SCROLL.bg2
			// , rect = this.selectedRect
			, rect = this.cellrects.paletteSelected
			, rectlen = rect.h + rect.w + 1
			, rectxy = rect.x + rect.y
			, x, y, tdisp = ((this.appClock * (rectlen / 20)) | 0) % rectlen
			, connect = {u: 0, d: 0, l: 0, r: 0}
			, s = this.sprites, mode = ''
			, udlr = {
				'0101': 'select_tl', '0111': 'select_tc', '0110': 'select_tr',
				'1101': 'select_ml', '1110': 'select_mr',
				'1001': 'select_bl', '1011': 'select_bc', '1010': 'select_br',
				'0000': 'select_single', '1100': 'select_pipe_v', '0011': 'select_pipe_h',
				'1000': 'select_cup_b', '0100': 'select_cup_t', '0010': 'select_cup_r', '0001': 'select_cup_l', 
			}
		;
		
		// console.log(tdisp);
		for(y = rect.y; y < rect.y + rect.h; y++){
			for(x = rect.x; x < rect.x + rect.w; x++){
				mode = false;
				mode = x + y - rectxy == tdisp ? '' : mode;
				mode = x + y - rectxy + 1 == tdisp ? 'd1_' : mode;
				mode = x + y - rectxy + 2 == tdisp ? 'd2_' : mode;
				if(mode === false){
					continue;
				}
				connect.u = rect.isContain(x, y - 1) | 0;
				connect.d = rect.isContain(x, y + 1) | 0;
				connect.l = rect.isContain(x - 1, y) | 0;
				connect.r = rect.isContain(x + 1, y) | 0;
				spr = '' + connect.u + connect.d + connect.l + connect.r;
				if(udlr[spr] == null){
					continue;
				}else{
					// console.log(mode + udlr[spr]);
					SCROLL.sprite.drawSpriteChunk(s[mode + udlr[spr]], cto(x) + scr.x, cto(y) + scr.y);
				}
			}
		}
		
	},
	
	drawSelectedPalette: function()
	{
		var scr = SCROLL.sprite
			, pos = this.ppControll.tapMovePos
			, r = this.rects.selectPalette
			, s = this.selectedSprites
		;
		if(this.appClock % 10 > 0){
			return;
		}
		if(!r.isContain(pos.x, pos.y)){
			return;
		}
		scr.drawSpriteChunk(s, r.x, r.y);
		
	},
	
	drawContainBgPalette: function()
	{
		var scr = SCROLL.sprite
			, pos = this.ppControll.tapMovePos
			, bgr = this.rects.bgPalette
			, s = this.selectedSpritesBg
		;
		
		if(this.appClock % 10 > 0){
			return;
		}
		if(!bgr.isContain(pos.x, pos.y)){
			return;
		}
		scr.drawSpriteChunk(s, bgr.x, bgr.y);
		
	},
	
	drawSlidePaletteScroll: function(){
		var bg3 = SCROLL.bg3
			, bg2 = SCROLL.bg2
			, ppos = this.margin.spritePalette.x
			, spos = this.margin.slidePalette.x
			, targetPos = ([
				0,
				this.margin.slidePalette.x,
				DISPLAY_WIDTH
			])[this.paletteSlideAlign]
		;
		
		bg3.x = this.ease.next();
		bg2.x = bg3.x + ppos;
	},
	
	//One Time Draw
	drawWindowBlank: function(){
		var bg3 = SCROLL.bg3
			, palettePos = this.margin.spritePalette
		;
		bg3.clear(null, makeRect(palettePos.x, palettePos.y, cto(16), cto(16)));
	},
	
	drawLoadedImage: function(){
		var sprites = this.loadedSprite
			, bg = SCROLL.bg2
			, pos = this.margin.loadedSpriteFrame
		;
		bg.clear(COLOR_BLACK);
		bg.drawSprite(sprites.full, 0, 0);
		
	},
	
	drawDropFileIcons: function(){
		var bg = SCROLL.sprite
			, framePos = {x: cto(2), y: cto(2)}
			, b
		;
		
		if(this.isLoaded){return;}
		
		b = this.fileHover ? (this.appClock / 2) : (this.appClock / 30);
		if((b | 0) % 2 == 0){
			bg.drawSpriteChunk(this.sprites.icon_upload, framePos.x + cto(8), framePos.y + cto(8));
			bg.drawSpriteChunk(this.sprites.arrow_u, framePos.x + cto(8.5), framePos.y + cto(10));
		}
	},
	
	drawBgPaletteCursor: function()
	{
		var bg = SCROLL.bg3
			, r = this.rects.bgPalette
			, selectR = this.cellrects.bgSelected
			, loadR = this.rects.spritePalette
		;
		bg.clear(null, loadR);
		bg.drawSpriteChunk(this.sprites.select_bgPalette, cto(selectR.x) + loadR.x, cto(selectR.y) + loadR.y);
	},
	
	drawSelectedSprite: function()
	{
		var bg = SCROLL.bg3
			, r = this.rects.selectPalette
		;
		bg.clear(null, r);
		bg.drawSpriteChunk(this.selectedSprites, r.x, r.y);
	},
	
	drawSelectedBg: function()
	{
		var bg = SCROLL.bg3
			, r = this.rects.bgPalette
		;
		bg.clear(null, r);
		bg.drawSpriteChunk(this.selectedSpritesBg, r.x, r.y);
	},
	
	draw: function()
	{
		this.drawDropFileIcons();
		this.drawPaletteCursor();
		this.drawSelectedRange();
		this.drawContainBgPalette();
		this.drawSelectedPalette();
		this.drawSlidePaletteScroll();
		this.drawCanvasCursor();
		this.appClock++;
	},
	
	keyCheck: function()
	{
		var cont = this.keyControll
			, state = cont.getState(['up', 'down', 'left', 'right', 'ext'])
			, trig = cont.getTrig(['select'])
		;
		if(state.left){
			this.bgPos.x -= 1 + this.boost;
		}
		if(state.right){
			this.bgPos.x += 1 + this.boost;
		}
		if(state.up){
			this.bgPos.y += 1 + this.boost;
		}
		if(state.down){
			this.bgPos.y -= 1 + this.boost;
		}
		
		if(state.ext){
			this.boost = true;
		}else{
			this.boost = false;
		}
		
		if(trig.select){
			this.isPaletteDisplay = !this.isPaletteDisplay;
			this.paletteSlideAlign = (this.paletteSlideAlign + 1) % 3;
			this.setPaletteSlide(this.paletteSlideAlign);
		}
	},
};

function main(){
	var scrolls = getScrolls();
	app.keyCheck();
	keyStateCheck();
	app.draw();
	drawCanvasStacks();
	
	scrolls.bg1.rasterto(scrolls.tmp);
	scrolls.bg2.rasterto(scrolls.tmp);
	scrolls.bg3.rasterto(scrolls.tmp);
	scrolls.sprite.rasterto(scrolls.tmp);
	scrolls.sprite.clear();
	
	screenView(scrolls.screen, scrolls.tmp);
	requestAnimationFrame(main);
}


document.addEventListener('DOMContentLoaded', function(){
	app = new SpriteQueryBuilder();
	app.init();
});

function getBuildCellSize(){
	var size = {
		w: document.getElementById('cellsize').value | 0,
		h: document.getElementById('cellsize').value | 0,
	};
	return size;
}

function imageDropFileHandle(element, func)
{
	function ondragoverFile(e) {
		e.preventDefault();
	}
	function ondragenterFile(e) {
		e.preventDefault();
		app.fileHover = true;
	}
	function dragleaveFile(e) {
		e.preventDefault();
		app.fileHover = false;
	}
	

	function dropFile(e) {
		var i,
			
		data = e.dataTransfer,
		reader = new FileReader(),
		arrowTypes = ['image/png', 'image/jpeg', 'image/gif'],
		filedata;
		e.preventDefault();
		for ( i = 0; i < data.files.length; i++) {
			filedata = data.files[i];
			if (arrowTypes.indexOf(filedata.type) == -1) {
				return;
			}
			reader.readAsDataURL(filedata);
			filedata.name;
		}
		reader.onload = function(e) {
			var img = new Image();
			img.src = e.target.result;
			img.onload = function() {
				func(img);
			};
		};
	}
	element.ondrop = dropFile;
	element.ondragover= ondragoverFile;
	element.ondragenter= ondragenterFile;
	element.ondragleave= dragleaveFile;
}

function index2Pos(id, w, h){
	return {x: id % w, y: (id / h) | 0};
}
