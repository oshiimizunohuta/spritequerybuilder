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
		this.pControll = new PointingControll();
		this.bgPos = {x: 0, y: 0};
		this.colorSwap = false;
		this.reverseEnable = true;
		this.boost = false;
		this.loadedSprite;
		this.selectedCells = [];
		this.selectedRect = MR('0 0 1 1');
		this.isLoaded = false;
		this.paletteSelect = {start: {x: -1, y: -1}, end: {x: -1, y: -1}, move: {x: -1, y: -1}};
		
		this.cursor = {
			palette: {x: 0, y: 0},
		};
		this.rects = {
			loadedSpriteFrame: MR('2 2 18 18 *8'),
			spritePalette: MR('3 3 16 16 *8'),
		};
		this.margin = {
			loadedSpriteFrame: {x: cto(2), y: cto(2)},
			spritePalette: {x: cto(3), y: cto(3)},
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
			self.pControll.init(scrollByName('screen'), scrollByName('bg2'));
			// self.pControll.init(scrollByName('screen'), scrollByName('bg1'));

			self.initSprites();
			self.initDrawBG();
			requestAnimationFrame(main);
			
			//TODO test
			self.setMouseEventPalette();

		});
	},
	
	initSprites: function(){
		var self = this
			, k, spr
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
			
			blankbg: ms(3),
			separate: ms(4, '^30'),
			bg_white: ms(5, '*31^30'),
			bg_frame: ms(null, '6 7*16 6|fh;(7|r3 63*16 7|r1)^16!;6|fv 7|fv*16 6|fvh'),
			icon_upload: ms(null, '0+2:6+2'),
			arrow_u: ms(58),
			cursor: ms(5),
		};
		
		for(k in this.sprites){
			if(k.search(/^select_\w*/) == -1){
				continue;
			}
			this.sprites['d1_' + k] = copyCanvasSpriteChunk(this.sprites[k]);
			this.sprites['d1_' + k] = swapColorSpriteRecursive(this.sprites['d1_' + k], 'set', [188, 188, 188, 255], COLOR_WHITE);
			this.sprites['d2_' + k] = copyCanvasSpriteChunk(this.sprites[k]);
			this.sprites['d2_' + k] = swapColorSpriteRecursive(this.sprites['d2_' + k], 'set', [124, 124, 124, 255], COLOR_WHITE);
		}
		
		
	},
	
	initDrawBG: function(){
		var bg1 = SCROLL.bg1
			, bg2 = SCROLL.bg2
			, bg3 = SCROLL.bg3
			, scr = SCROLL.screen
			, framePos = this.margin.loadedSpriteFrame
			, palettePos = this.margin.spritePalette
			;
			
		bg1.clear(COLOR_BLACK);
		
		bg2.clear();
		bg2.x = palettePos.x;
		bg2.y = palettePos.y;
		
		bg3.clear();
		bg3.drawSpriteChunk(this.sprites.separate, 0, 0);
		bg3.drawSpriteChunk(this.sprites.bg_white, cto(1), 0);
		bg3.drawSpriteChunk(this.sprites.bg_frame, framePos.x, framePos.y);
		this.drawWindowBlank();
		
	},
	
	openSpriteImage: function(img){
		var size = getBuildCellSize(),
			res = imageResource
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
		this.loadedSprite.cellrect = MR(0, 0, tocellh(img.wdth), tocellh(img.height));
		this.isLoaded = true;
		this.drawLoadedImage();
		
		this.setMouseEventPalette();
	},
	
	i2pos: function(id)
	{
		var name = this.loadedSprite.image.name
			, nums = imageCellsNum(name)
		;
		pos = index2Pos(id, nums.w, nums.h);
		return pos;
	},
	
	setMouseEventPalette: function()
	{
		var r = this.rects.spritePalette
			, self = this
			, sel = this.paletteSelect
		;
		this.pControll.appendTappableItem(
			MR('0 0 16 16 *8'),
			function(item, x, y){
				sel.start.x = x;
				sel.start.y = y;
				sel.end.x = -1;
				sel.end.y = -1;
			}, function(item, x, y){
				sel.end.x = x;
				sel.end.y = y;
				self.makeSelect();
			}
			, 'palletsel'
		);
		this.pControll.appendFlickableItem(
			MR('0 0 16 16 *8'),
			function(item, x, y){
				sel.move.x = x;
				sel.move.y = y;
			}, function(item, x, y){
				sel.move.x = -1;
				sel.move.y = -1;
			}
			, 'palletsel'
		);
	},
	
	makeSelect: function(rect){
		var img = this.loadedSprite.image
			, pw = img.width
			, ph = img.height
			, sel = this.paletteSelect
			, size = getBuildCellSize()
			, x, y, id
			;
		
		this.selectedCells = [];
		for(y = sel.start.y; y < sel.end.y; y += size.h){
			for(x = sel.start.x; x < sel.end.x; x += size.w){
				id =tocellh(x) + (tocellh(y) * tocellh(pw));
				this.selectedCells.push(id);
			}
		}
		this.selectedRect = MR([tocellh(sel.start.x), tocellh(sel.start.y), tocellh(sel.end.x) + 1, tocellh(sel.end.y) + 1].join(' ') + ' :pos');	},
	

	//Repeat Draw
	drawPaletteCursor: function(){
		var tpos = this.pControll.tapMovePos
		, r = this.rects.spritePalette
		, scr = SCROLL.bg2
		;
		if(this.appClock % 2 == 0){
			return;
		}
		
		if(this.rects.spritePalette.isContain(tpos.x + scr.x, tpos.y + scr.y) == false){
			return;
		}
		SCROLL.sprite.drawSpriteChunk(this.sprites.cursor, parseCell(tpos.x) + scr.x, parseCell(tpos.y) + scr.y);
	},
	
	drawSelectedRange: function()
	{
		var tpos = this.pControll.tapMovePos
			, spr, scr = SCROLL.bg2
			, rect = this.selectedRect
			, rectlen = rect.h + rect.w
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
	
	draw: function()
	{
		this.drawDropFileIcons();
		this.drawPaletteCursor();
		this.drawSelectedRange();
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
			this.colorSwap = !this.colorSwap;
			this.swapBg(this.colorSwap);
			if(!this.colorSwap){
				this.reverseEnable = !this.reverseEnable;
			}
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
