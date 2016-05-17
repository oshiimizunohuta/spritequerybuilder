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
		this.debugCount = 0;
		this.debugCountMax = 1;
		this.debugCursorPos = {x: 0, y: 0};
		//TODO debugでcompressをみてみよう
		
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
		this.spritesEraser;
		this.canvasPuts; //sprites id put in Canvas Array
		this.selectedCells = [];
		this.selectedSprites;
		this.selectedSpritesBg;
		this.events ={
			preRefreshCanvasPos : {x: -1, y: -1}
			, asSetRefreshCanvasPos : {x: -1, y: -1}
		};
		this.compressQueries = {};
		this.sortedQueries = [];
		// this.preNegRefreshCanvasPos = {x: 0, y: 0};
		// this.setRefreshCanvasPos = {x: 0, y: 0};
		this.isLoaded = false;
		this.paletteSelect = {start: {x: -1, y: -1}, end: {x: -1, y: -1}, move: {x: -1, y: -1}};
		this.paletteSource = 'image'; //'image' or 'canvas'
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
			base: MR(0, 0, tocellh(DISPLAY_WIDTH), tocellh(DISPLAY_HEIGHT)),
			selectChunk: MR('-1 -1 1 1'),
		};
		
		this.rects = {
			loadedSpriteFrame: MR('2 2 18 18 *8'),
			spritePalette: MR('3 3 16 16 *8'),
			bgPalette: MR('16 21 3 3 *8'),
			selectPalette: MR('3 21 8 8 *8'),
			base: MR(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT),
		};
		this.margin = {
			loadedSpriteFrame: {x: cto(2), y: cto(2)},
			spritePalette: {x: cto(3), y: cto(3)},
			bgPalette: {x: cto(15	), y: cto(20)},
			selectPalette: {x: cto(2), y: cto(20)},
			slidePalette: {x: cto(19), y: 0},
		};
		
		var self = this, img, size = getBuildCellSize(), bg;
		
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
		
		imageDropFileHandle(scrollByName('screen').canvas, function(img){
			self.openSpriteImage(img);
		});
		
		SCROLL = getScrolls();
		bg = SCROLL.bg1.canvas;
		this.canvasPuts = new Int16Array(((bg.width / size.w) | 0) * ((bg.height / size.h) | 0));
		this.canvasPuts.fill(-1);
		setResourceFromCanvas(SCROLL.bg1, getBuildCellSize().w, getBuildCellSize().h);
		
		loadImages([['sprites', 8, 8]], function(){
			//TODO test sprite
			img = new Image();
			img.src = './img/sprites.png';
			img.onload = function(){
				self.openSpriteImage(this);
			};
			
			self.keyControll.initCommonKey();
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
			select_spriteChunk: ms(5),
			
			blankbg: ms(9, '*32^30'),
			separate: ms(4, '^30'),
			bg_white: ms(5, '*31^30'),
			black: ms(63),
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
		swap(this.sprites.select_spriteChunk, 'set', [248, 216, 120, 255], COLOR_WHITE);
		
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
		this.setBgPalette(MR([r.w - 1, r.h - 1, r.w, r.h].join(' '))); 
		this.makeSelect();
		// this.makeSelect(MR([r.w - 1, r.h - 1, 1, 1].join(' ') + ' *8'));
		
		this.setMouseEventPalette();
		this.setMouseEventBgPalette();
		this.setMouseEventSelectedSprite();
		this.setMouseEventCanvas();
	},
	
	i2pos: function(id)
	{
		var name = this.loadedSprite.image.name
			, nums = imageCellsNum(name)
		;
		pos = index2Pos(id, nums.w, nums.h);
		return pos;
	},
	
	setMouseEventCanvas: function()
	{
		var r = this.rects.base
			, self = this
			, sel = this.paletteSelect
			, palRect
		;
		//left button
		this.cpControll.appendTappableItem(
			r,null, function(item, x, y){
				palRect = SCROLL.bg3.getRect();
				if(palRect.isContain(x, y)){return;}
				self.events.preRefreshCanvasPos = {x: x, y: y};
			}
			, 'cvput'
		);		
		this.cpControll.appendFlickableItem(
			r,
			function(item, x, y){
				palRect = SCROLL.bg3.getRect();
				if(palRect.isContain(x, y)){return;}
				self.events.preRefreshCanvasPos = {x: x, y: y};
			}, function(item, x, y){
			}
			, 'cvput'
		);
		//right button
		this.cpControll.appendTappableItem(
			r, function(item, x, y){
				sel.start.x = x;
				sel.start.y = y;
				sel.end.x = -1;
				sel.end.y = -1;
				
			}, function(item, x, y){
				sel.end.x = x;
				sel.end.y = y;
				palRect = SCROLL.bg3.getRect();
				if(palRect.isContain(x, y)){return;}
				self.paletteSource = 'canvas';
				self.makeSelectByCanvas(sel.start.x, sel.start.y, sel.end.x, sel.end.y);
				self.events.preRefreshCanvasPos = {x: -1, y: -1};
			}
			, 'dropper', 'right'
		);
		this.cpControll.appendFlickableItem(
			r,
			function(item, x, y){
				sel.move.x =  x - r.x;
				sel.move.y =  y - r.y;
			}, function(item, x, y){
				sel.move.x = -1;
				sel.move.y = -1;
			}
			, 'dropper', 'right'
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
				var r = self.cellrects.paletteSelected
					, sr = self.loadedSprite.cellrect;
				self.setBgPalette(MR(r.x, r.y, sr.w, sr.h));
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
				self.paletteSource = 'image';
				
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
			, selected = []
			, comp = this.compressQueries
			;
		sx = sx == null ? sel.start.x : sx;
		sy = sy == null ? sel.start.y : sy;
		ex = ex == null ? sel.end.x : ex;
		ey = ey == null ? sel.end.y : ey;
		
		sx = tocellh(sx);
		sy = tocellh(sy);
		ex = tocellh(ex);
		ey = tocellh(ey);
		sr = MR([sx, sy, ex, ey].join(' ') + ' :pos');
		
		for(y = sr.y; y < sr.ey; y++){
			selected.push([]);
			for(x = sr.x; x < sr.ex; x++){
				id = x + (y * tocellh(pw));
				selected[selected.length - 1].push(id);
			}
		}
		this.selectedCells = selected;
		this.cellrects.paletteSelected = sr;
		
		q = '' + sr.x + '+' + sr.w + ':' + sr.y + '+' + sr.h;
		this.selectedSprites = makeSpriteQuery(img.name, q);
		this.spritesEraser = makeSpriteQuery(this.uiSpriteName, '63*' + sr.w + '^' + sr.h);
		
		if(sr.w == 1 && sr.h == 1){
			return;
		}
		comp[q] = q in comp ? comp[q] : {rect: sr, sprites: this.convertCanvasPuts(this.selectedSprites), query: q};
		this.sortedQueries = this.sortQueries(comp);
		console.log(q, comp, this.sortedQueries);
	},
	
	/**
	 * キャンバスから選択したパレットを作成する
	 */
	makeSelectByCanvas: function(sx, sy, ex, ey){
		var img = this.loadedSprite.image
			, pw = this.cellrects.base.w
			, ph = this.cellrects.base.h
			, sel = this.paletteSelect
			, size = getBuildCellSize()
			, q = '', sr
			, x, y, id
			, selected = []
			;
		sx = sx == null ? sel.start.x : sx;
		sy = sy == null ? sel.start.y : sy;
		ex = ex == null ? sel.end.x : ex;
		ey = ey == null ? sel.end.y : ey;
		
		sx = tocellh(sx);
		sy = tocellh(sy);
		ex = tocellh(ex);
		ey = tocellh(ey);
		sr = MR([sx, sy, ex, ey].join(' ') + ' :pos');
		
		for(y = sr.y; y < sr.ey; y++){
			selected.push([]);
			for(x = sr.x; x < sr.ex; x++){
				id = this.canvasPuts[x + (y * pw)];
				selected[selected.length - 1].push(id);
			}
		}
		
		this.selectedCells = selected;
		this.cellrects.paletteSelected = sr;
		
		q = '' + sr.x + '+' + sr.w + ':' + sr.y + '+' + sr.h;
		
		this.selectedSprites = makeSpriteChunk(img.name, selected);
		this.spritesEraser = makeSpriteQuery(this.uiSpriteName, '63*' + sr.w + '^' + sr.h);
		console.log(this.compressQueries, this.sortedQueries);
	},
	
	/**
	 * キャンバスにスプライトを置く
	 */
	putSpritePalette: function(x, y){
		var bg1 = SCROLL.bg1
			, tpos = this.cpControll.getMovePos()
			, cv3 = SCROLL.bg3.canvas
			, pr = MR(SCROLL.bg3.x, 0, cv3.width, cv3.height)
			, ppos = {x: parseCell(x), y: parseCell(y)}
			, cpos = {x: tocellh(x), y: tocellh(y)}
			, cr = this.cellrects.paletteSelected
			, selectR = this.selectedCells
			, j, i
			, sizeW = (cv3.width / getBuildCellSize().w) | 0
		;
		if(pr.isContain(tpos.x, tpos.y)){
			return;
		}
		
		for(j = 0; j < selectR.length; j++){
			for(i = 0; i < selectR[j].length; i++){
				this.canvasPuts[((cpos.y + j) * sizeW) + (cpos.x + i)] = this.selectedCells[j][i];
			}
		}
		// bg1.drawSpriteChunk(this.spritesEraser, ppos.x, ppos.y);
		// bg1.drawSpriteChunk(this.selectedSprites, ppos.x, ppos.y);
		
	},
	
	getBuildCellsRect: function(){
		var s = getBuildCellSize()
			, cv = SCROLL.bg3.canvas;
		return MR(0, 0, (cv.width / s.w) | 0, (cv.height/ s.h) | 0);
	},
	
	/**
	 * 縦に長いものを優先
	 */
	sortQueries: function(target){
		var keys = Object.keys(target)
			, ex = /[0-9]+\+([0-9]+)\:[0-9]+\+([0-9]+)/;
		
		keys = keys.sort(function(a, b){
			var ap = ex.exec(a), bp = ex.exec(b);
			a = ap[0] === null ? 1 : ap[2] | 0;
			b = bp[0] === null ? 1 : bp[2] | 0;
			if(a != b){
				return a < b;
			}
			a = ap[0] === null ? 1 : ap[1] | 0;
			b = bp[0] === null ? 1 : bp[1] | 0;
			return a < b;
		});
		return keys;
	},

	convertQuery: function(sprites, range){
		var i, j, spritesH = [], spritesV
			, puts = sprites == null ? this.canvasPuts : sprites, put
			, slRect = MR([range.l, range.t, range.r, range.b].join(' ') + ' :pos')
			, comp = this.compressQueries
			, q = []
			, w = range.r - range.l
			;
		// for(j = 0; j < slRect.h; j++){
			// i = j * slRect.w;
			// q.push(puts.slice(i, i + slRect.w).join(' '));
		// }
		for(j = 0; j < puts.length; j++){
			q.push(puts[j].join(' '));
		}
		return q.join(';');
	},
	
	/**
	 * 書き込み済みの範囲を検出
	 * @param {Int16Array} puts=canvasPuts
	 * @param {Rect} rect=buildCellRect
	 */
	enableRange: function(puts, rect){
		var range = {}, y, i, j, len
		;
		rect = rect == null ? this.getBuildCellsRect() : rect;
		puts = puts == null ? this.canvasPuts : puts;
		len = puts.length;
		for(i = 0; i < len; i++){
			if(range.t == null && puts[i] > -1){
				range.t = (i / rect.w) | 0;
			}
			if(range.b == null && puts[len - i - 1] > -1){
				range.b = ((len - i - 1) / rect.w) | 0;
			}
		}
		for(i = 0; i < len; i++){
			y = ((i % rect.h) * rect.w) + ((i / rect.h) | 0);
			if(range.l == null && puts[y] > -1){
				range.l = (i / rect.h) | 0;
			}
			if(range.r == null && puts[len - y - 1] > -1){
				range.r = ((len - i - 1) / rect.h) | 0;
			}
		}
		return range;
	},
	
	trimCanvasPuts: function(puts, range, rect){
		var ranged, slRect, j, i = 0, start;
		rect = rect == null ? this.getBuildCellsRect() : rect;
		slRect = MR([range.l, range.t, range.r, range.b].join(' ') + ' :pos');
		ranged = new Int16Array(slRect.w * slRect.h);
		
		for(j = slRect.y; j < slRect.ey; j++){
			start = slRect.x + (rect.w * j);
			ranged.set(puts.slice(start, start + slRect.w), i);
			i += slRect.w;
		}

		return new Int16Array(ranged);
	},
	
	convertCanvasPuts: function(sprChunk){
		var i, j, conv = [], w, h, spr;
		for(j = 0; j < sprChunk.length; j++){
			for(i = 0; i < sprChunk[j].length; i++){
				spr = sprChunk[j][i];
				conv.push(spr.id);
			}
		}
		return new Int16Array(conv);
	},
	
	scanHeight: function(chunkQuery){
		var match, h, m
		;
		match = exp.exec(chunk);
		if(match == null){
			return 1;
		}
		h = match[2] == null ? 1 : match[2];
		m = match[4]== null ? 1 : match[4];
		return h * m;
	},
	
	alignChunks: function(sprites){
		var i, j, k
			, spritesG, spritesH, grouped
			, chunked, chunks
			, preHeight, height
			, exp = /([:]\d+\+(\d+))?(\w|\d|[|*()])\^(\d)/
			, scanLineHeight = function(line){
				var topHeight = 0, x, match, h, m;
				for(x in line){
					match = exp.exec(line[x]);
					h = match[2] == null ? 1 : match[2];
					m = match[4]== null ? 1 : match[4];
					topHeight = topHeight < (h * m) ? (h * m) : topHeight;
				}
				return topHeight;
			}
			, scanHeight = function(chunk){
				var match, h, m
				;
				match = exp.exec(chunk);
				if(match == null){
					return 1;
				}
				h = match[2] == null ? 1 : match[2];
				m = match[4]== null ? 1 : match[4];
				return h * m;
			}
			, groupingL = function(spr, x, y, h){
				var j, i, len, grouped
				;
				grouped = [];
				for(j = y; j < h; j++){
					if(spr[j] == null){
						continue;
					}
					len = grouped.length;
					grouped.push([]);
					for(i = 0; i < x;  i++){
						if(spr[j][i] == null){
							continue;
						}
						grouped[len].push(spr[j][i]);
						delete spr[j][i];
					}
					delete spr[j];
				}
				for(j = 0; j < grouped.length; j++){
					grouped[j] = grouped[j].join(' ');
				}
				
				spr[y] = ['(' + grouped.join(';') + ')'];
				return spr;
			}
			, groupingR = function(spr, x, y, h){
				var j, i, len, grouped
				;
				grouped = [];
				for(j = y; j < h; j++){
					if(spr[j] == null){
						continue;
					}
					len = grouped.length;
					grouped.push([]);
					if(spr[j][i] == null){
						continue;
					}
					grouped[len].push(spr[j][i]);
					delete spr[j][i];
					delete spr[j];
				}
				for(j = 0; j < grouped.length; j++){
					grouped[j] = grouped[j].join(' ');
				}
				
				spr[y] = grouped.length == 1 ? grouped[0] : ['(' + grouped.join(';') + ')'];
				return spr;
			}
		;
		spritesG = {};
		for(j in sprites){
			spritesH = sprites[j];
			// height = scanLineHeight(spritesV);
			preHeight = null;
			spritesG[j] = {}; 
			for(i in spritesH){
				height = scanHeight(spritesH[j]);
				if(preHeight == null){
					spritesG[j][i] = spritesH[i];
				}else if(height > preHeight){
					spritesG = groupingL(sprites, i, j, height);
				}else if(height < preHeight){
					spritesG = groupingR(sprites, i, j, height);
				}else{
					spritesG[j][i] = spritesH[i];
				}
				preHeihgt = height;
			}
			// q += spritesG.join(' ') + ';';
		}
		
		chunked = [];
		console.log(spritesG);
		for(j in spritesG){
			chunks = [];
			for(i in spritesG[j]){
				chunks.push(spritesG[j][i]);
			}
			chunked.push(chunks);
		}
		console.log(chunked);
		
		return chunked;
	},
	
	// TODO 先に細かいペアを整理する
	scanCanvasPair: function(finded){
		var puts = this.canvasPuts
			, find, find_first, id = -1, idStack = [], paired = {}, vPaired = {}
			, rect = this.getBuildCellsRect()
			, range = this.enableRange(puts, rect)
			, erect = MR([range.l, range.t, range.r, range.b].join(' ') + ' :pos')
			, cw = rect.w
			, i, f, q, r, s, x, y, pcnt = 0
			, qsearch = function(x, y){
				var chunks, q, i, ck;
				for(q in finded){
					chunks = finded[q];
					for(i = 0; i < chunks.length; i++){
						ck = chunks[i];
						if(ck.x == x && ck.y == y){
							return q;
						}
						if(ck.isContain(x, y)){
							return null;
						}
					}
				}
				return "single";
			}
			, doIdPairStack = function(id, stack, paired_y, x, mode)
			{
				//idとstackが違うときにスタックする
				var slen = stack.length;
				if(id == stack[0] || slen == 0){
					console.log(stack[0]);
					return stack;
				}
				if(stack[0].match(/[:\+]/) != null){
					paired_y[x] = slen == 1 ? stack[0] : '(' + stack[0] + ')' + mode + slen;
					// paired_y[x] = stack[0];
					stack = [];
				}else if(id != stack[0]){
					// console.log(paired_y, x);
					paired_y[x] = slen == 1 ? stack[0] : stack[0] + mode + slen;
					stack = [];
				}
				return stack;
			}
		;
		
		for(y = erect.y; y < erect.ey; y++){
			paired[y] = {};
			find_first = 0;
			for(x = erect.x; x < erect.ex; x++){
				find = qsearch(x, y);
				if(find === null){
					continue;
				}
				//idをカウント
				id = find === 'single' ? puts[x + (cw * y)] + '' : find;
				idStack = doIdPairStack(id, idStack, paired[y], find_first, '*');
				find_first = idStack.length == 0 ? x : find_first;
				idStack.push(id);
			}
			if(Object.keys(paired[y]).length > 0 || id !== null){
				//idをわざとずらして末端処理
				idStack = doIdPairStack(id + 1, idStack, paired[y], find_first, '*');
			}

			id = null;
		}
// console.log(paired)

		// TODO 縦の圧縮？
		idStack = [];
		id = '-1';
		for(x = erect.x; x < erect.ex; x++){
			find_first = 0;
			for(y = erect.y; y < erect.ey; y++){
				if(paired[y] == null){continue;}
				//縦ペア初期化
				vPaired[y] = vPaired[y] == null ? {} : vPaired[y];
				find = qsearch(x, y);
				if(find === null){
					continue;
				}
				//idをカウント
				id = find === 'single' ? paired[y][x] : find;
				if(id == null){
					continue;
				}
			// console.log(vPaired, paired, idStack, x, y,  find, find_first);
			
				//ペア出力をスタック＆idStackを更新
				idStack = doIdPairStack(id, idStack, vPaired[find_first], x, '^');
				
				//最初にidが見つかった位置
				find_first = idStack.length == 0 ? y : find_first;
				idStack.push(id);
					// console.log(find, vPaired[y], idStack)
			// console.log(vPaired, idStack, y,  find, find_first);
			}
			if(find_first == 0){
				continue;
			}
			//idをわざとずらして末端処理
			if(id !== null || Object.keys(vPaired[find_first]).length > 0){
				idStack = doIdPairStack(id + 1, idStack, vPaired[find_first], x, '^');
			}
			id = null;
		}
		
		for(i in vPaired){
			if(Object.keys(vPaired[i]).length == 0){
				delete vPaired[i];
			}
		}
		
		console.log(vPaired)
		return vPaired;
	},
	/**
	 * 配置周辺のペアをスキャン
	 * @param {findedChunks} finded
	 */
	//TODO 要検証
	scanCanvasChunks: function(finded){
		// console.log(finded);
		// return;
		var cqueries = this.compressQueries
			// , comp = finded
			, sorted = this.sortedQueries
			, puts = this.canvasPuts
			, chunked = {h: [], v: []}
			, find = null, preFind
			// , finded = {}, find
			, rect = this.getBuildCellsRect()
			, range = this.enableRange(puts, rect)
			, erect = MR([range.l, range.t, range.r, range.b].join(' ') + ' :pos')
			, cw = range.r - range.l
			, i, f, q, r, s, x, y, pcnt = 0
			//位置から登録済みchunkを見つける
			, search = function(x, y, findedChunks){
				var chunks, q, i;// finded = findedChunks;
				for(q in finded){
					chunks = finded[q];
					for(i = 0; i < chunks.length; i++){
						if(chunks[i].x == x && chunks[i].y == y){
							// console.log(chunks[i]);
							return chunks[i];
						}
					}
				}
				return null;
			}
			//横のペア数を検出 source:findedChunk
			, hPairSkip = function(s){
				var x, y = s.y, f, cnt = 0, q;
				for(x = s.x; x < erect.ex; x++){
					f = search(x, y, finded);
					q = f === null ? puts[x + (cw * y)] : f.query;
					if(q == s.query){
						cnt++;
					}else{
						break;
					}
				}
				return cnt * s.w;
			}
			//縦のペア数を検出 source:findedChunk 
			, vPairSkip = function(s){
				var x = s.x, y, f, cnt = 0, q;
				for(y = s.y; y < erect.ey; y++){
					f = search(x, y, finded);
					q = f === null ? puts[x + (cw * y)] : f.query;
					if(q == s.query){
						cnt++;
					}else{
						break;
					}
				}
				return cnt * s.w;
			}
			// finded:findedChunk r: Rect
			, overlap = function(finded, r){
				var f, len, i, cr;
				for(f in finded){
					cr = finded[f];
					len = cr.length;
					for(i = 0; i < len; i++){
						if(cr[i] == null){
							continue;
						}
						if(cr[i].isFit(r) || cr[i].isOverlap(r)){
							return true;
						}
					}
				}
				return false;
			}
		;
		console.log('holizon')
		for(y = erect.y; y < erect.ey; y++){
			for(x = erect.x; x < erect.ex; x++){
				preFind = find;
				find = search(x, y, finded);
				id = puts[x + (cw * y)];
				find = find === null ? MR(x, y, 1, 1) : find;
				
				pcnt = hPairSkip(find);
				
				if(!overlap(finded, find)){
					// finded.h.push({count: pcnt, query: find.query, x: x, y: y});
					chunked.h.push(find);
					// finded[x + ' ' + y] = [find];
				}
				console.log(pcnt);
				x += pcnt;
			}
		}
		// console.log(chunked, finded);
		// return chunked;
		
		console.log('vertical')
		for(x = erect.x; x < erect.ex; x++){
			for(y = erect.y; y < erect.ey; y++){
				find = search(x, y, chunked);
				id = puts[x + (cw * y)];
				find = find === null ? MR(x, y, 1, 1) : find;
				pcnt = vPairSkip(find);
				if(!overlap(finded, find)){
					chunked.v.push(find);
					// finded[x + ' ' + y] = [find];
					// finded.v.push({count: pcnt, query: find.query, x: x, y: y});
				}
				console.log(pcnt);
				y += pcnt;
			}
		}
		
		console.log(chunked, finded);
		return chunked;
	},
	
	/**
	 * クエリごとの配置をスキャン
	 */
	scanPaletteChunks: function(){
		var comp = this.compressQueries
			, sorted = this.sortedQueries
			, puts = this.canvasPuts
			, finded = {}, find
			, rect = this.getBuildCellsRect()
			, range = this.enableRange(puts, rect)
			, erect = MR([range.l, range.t, range.r, range.b].join(' ') + ' :pos')
			, cw = range.r - range.l
			, i, f, q, r, s, x, y, pcnt = 0
			, compare = function(s, c, sx, sy){
				var x = 0, y = 0, w = c.w, h = c.h, putW = rect.w;
				for(y = 0; y < h; y++){
					for(x = 0; x < w; x++){
						if(puts[(sx + x) + ((sy + y) * putW)] != s[x + (y * w)]){
							return null;
						}
					}
				}
				return MR(sx, sy, c.w, c.h);
			}
			, overlap = function(finded, r){
				var f, len, i, cr;
				for(f in finded){
					cr = finded[f];
					len = cr.length;
					for(i = 0; i < len; i++){
						if(cr[i] == null){
							continue;
						}
						if(cr[i].isOverlap(r)){
							return true;
						}
					}
				}
				return false;
			}
		;
		
		for(i = 0; i < sorted.length; i++){
			q = sorted[i];
			//圧縮句のrectを取得
			r = comp[q].rect;
			s = comp[q].sprites;
			//有効範囲から合致する全ての位置をrectで探す
			finded[q] = [];
			for(y = erect.y; y < erect.ey; y++){
				for(x = erect.x; x < erect.ex; x++){
					find = compare(s, r, x, y);
					
					//既に検出済みの位置・範囲を除外
					if(find == null || overlap(finded, find)){
						continue;
					}
					// console.log(find, x, y);
					//検出済みに追加
					finded[q].push(find);
					if(this.debugCount == pcnt){
						this.cellrects.selectChunk = find;
						// console.log(find)
						this.debugCursorPos.x = x;
						this.debugCursorPos.y = y;
					}
					pcnt++;
				}
			}
		}
		for(q in finded){
			if(finded[q].length == 0){
				console.log('del ' + q);
				delete comp[q];
				delete finded[q];
			}
		}
		this.debugCountMax = pcnt > 0 ? pcnt : 1;
		this.sortedQueries = this.sortQueries(comp);
		// console.log(finded);
		return finded;
	},
	
	/**
	 * イベントをAppで処理
	 */
	eventsProcess: function(){
		var pre = this.events.preRefreshCanvasPos
			, x = tocellh(pre.x)
			, y = tocellh(pre.y)
			, asset = this.events.asSetRefreshCanvasPos
			, finded, paired, aligned
		;
		
		if(x == asset.x && y == asset.y){
			return;
		}
		if(pre.x < 0 || pre.y < 0){
			asset.x = pre.x;
			asset.y = pre.y;
			return;
		}
		this.putSpritePalette(pre.x, pre.y);
		finded = this.scanPaletteChunks();
		paired = this.scanCanvasPair(finded);
		// this.scanCanvasChunks(finded);
		this.drawRefreshCanvas(pre.x, pre.y);
		aligned = this.alignChunks(paired);
		this.outputSpriteQueryBatch(aligned);
		asset.x = x;
		asset.y = y;
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

	drawRefreshCanvas: function(x, y){
		var bg1 = SCROLL.bg1
			, ppos = {x: parseCell(x), y: parseCell(y)}
		;
		bg1.drawSpriteChunk(this.spritesEraser, ppos.x, ppos.y);
		bg1.drawSpriteChunk(this.selectedSprites, ppos.x, ppos.y);
	},
			
	//Repeat Draw
	
	outputSpriteQueryBatch: function(source){
		var rect = this.getBuildCellsRect()
			, range = this.enableRange(this.canvasPuts, rect)
			, sprites = source != null ? source : this.trimCanvasPuts(this.canvasPuts, range, rect)
			, bgid = this.bgPaletteId
		;
		
		if(source == null){
			sprites = sprites.map(function(a, i){
				return '-1' ? bgid : a;
			});
		}else{
			sprites = source;
			sprites = Object.keys(sprites).map(function(a, i){
				return Object.keys(sprites[a]).map(function(b, i){
					// console.log(sprites[a][b].replace(/\-1/g, bgid));
					return sprites[a][b].replace(/\-1/g, bgid);
				});
			});
		
		}
		
		refreshTextArea(this.convertQuery(sprites, range));
	},

	drawPaletteCursor: function(){
		var tpos = this.ppControll.getMovePos()
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
		var tpos = this.cpControll.getMovePos()
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
	
	drawDebugCanvasCursor: function(){
		var rect = this.getBuildCellsRect()
			, tch = tocellh
			, cv1 = SCROLL.bg1.canvas
			, cv3 = SCROLL.bg3.canvas
			, r = MR(0, 0, tch(cv1.width), tch(cv1.height))
			, bgr = MR(tch(SCROLL.bg3.x), 0, tch(cv3.width), tch(cv3.height))
			, crect = this.cellrects.selectChunk
			, x, y, ex = crect.ex, ey = crect.ey
			, clp = (((this.appClock / 3) | 0) % (crect.w + crect.h)) + crect.x + crect.y
		;
		if(this.appClock % 3 == 0){
			return;
		}
		for(y = crect.y; y < ey; y++){
			for(x = crect.x; x < ex; x++){
				if(x + y != clp || x < 0 || y < 0){
					continue;
				}
				if(r.isContain(x, y) == false || bgr.isContain(x, y)){
					continue;
				}
				SCROLL.sprite.drawSpriteChunk(this.sprites.select_spriteChunk, cto(x), cto(y));
				
			}
		}
		
	},
	
	drawSelectedRange: function()
	{
		var tpos = this.ppControll.getMovePos()
			, spr, scr = this.paletteSource === 'image' ? SCROLL.bg2 : SCROLL.bg1
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
					SCROLL.sprite.drawSpriteChunk(s[mode + udlr[spr]], cto(x) + scr.x, cto(y) + scr.y);
				}
			}
		}
		
	},
	
	drawSelectedPalette: function()
	{
		var scr = SCROLL.sprite
			, pos = this.ppControll.getMovePos()
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
			, pos = this.ppControll.getMovePos()
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
		
	draw: function()
	{
		this.drawDropFileIcons();
		this.drawPaletteCursor();
		this.drawSelectedRange();
		this.drawContainBgPalette();
		this.drawSelectedPalette();
		this.drawSlidePaletteScroll();
		this.drawCanvasCursor();
		this.drawDebugCanvasCursor();
		// this.drawRefreshCanvas();
		this.appClock++;
	},
	
	keyCheck: function()
	{
		var cont = this.keyControll
			, state = cont.getState(['up', 'down', 'left', 'right', 'ext'])
			, trig = cont.getTrig(['select', '>', '<'])
			, hold = cont.getHold(['select', '>', '<'])
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
		
		if(trig['>'] || hold['>']){
			this.debugCount = (this.debugCount + 1) % this.debugCountMax;
			this.scanPaletteChunks();
		}
		if(trig['<'] || hold['<']){
			this.debugCount = (this.debugCount + this.debugCountMax - 1) % this.debugCountMax;
			this.scanPaletteChunks();
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
	app.eventsProcess();
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

function refreshTextArea(t){
	document.getElementById('spritequery').innerText = t;
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
