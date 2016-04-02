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

function SpriteQueryBuilder(){
	return;
}
SpriteQueryBuilder.prototype = {
	init: function(){
		this.uiSpriteName = 'sprites';
		this.sprites = {};
		this.appColock = 0;
		this.fileHover = false;
		this.word8;
		this.keyControll = new KeyControll();
		this.bgPos = {x: 0, y: 0};
		this.colorSwap = false;
		this.reverseEnable = true;
		this.boost = false;
		this.loadedSprite;
		this.isLoaded = false;
		
		this.margin = {
			loadedSpriteFrame: {x: cto(2), y: cto(2)},
			spritePalette: {x: cto(3), y: cto(3)},
		};
		
		var self = this;
		
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
		
		loadImages([['sprites', 8, 8]], function(){
			self.keyControll.initDefaultKey();
			self.keyControll.setKey('ext', 16);

			self.initSprites();
			self.initDrawBG();
			requestAnimationFrame(main);
		});
	},
	
	initSprites: function(){
		var self = this
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
			select_mc: ms(2),
			select_mr: ms(1, '|r1'),
			select_bl: ms(0, '|fv'),
			select_bc: ms(1, '|fv'),
			select_br: ms(0, '|fvh'),
			blankbg: ms(3),
			separate: ms(4, '^30'),
			bg_white: ms(5, '*31^30'),
			bg_frame: ms(null, '6 7*16 6|fh;(7|r3 63*16 7|r1)^16!;6|fv 7|fv*16 6|fvh'),
			icon_upload: ms(null, '0+2:1+2'),
			arrow_u: ms(10),
		};
	},
	
	initDrawBG: function(){
		var bg1 = scrollByName('bg1')
			, bg2 = scrollByName('bg2')
			, bg3 = scrollByName('bg3')
			, scr = scrollByName('screen')
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
		this.isLoaded = true;
		this.drawLoadedImage();
	},
	
	drawWindowBlank: function(){
		var bg3 = scrollByName('bg3')
			, palettePos = this.margin.spritePalette
		;
		bg3.clear(null, makeRect(palettePos.x, palettePos.y, cto(16), cto(16)));
	},
	
	drawLoadedImage: function(){
		var sprites = this.loadedSprite
			, bg = scrollByName('bg2')
			, pos = this.margin.loadedSpriteFrame
		;
		bg.drawSprite(sprites.full, 0, 0);
		
	},
	
	drawDropFileIcons: function(){
		var bg = scrollByName('sprite')
			, framePos = {x: cto(2), y: cto(2)}
			, b
		;
		
		if(this.isLoaded){return;}
		
		b = this.fileHover ? (this.appColock / 2) : (this.appColock / 30);
		if((b | 0) % 2 == 0){
			bg.drawSpriteChunk(this.sprites.icon_upload, framePos.x + cto(8), framePos.y + cto(8));
			bg.drawSpriteChunk(this.sprites.arrow_u, framePos.x + cto(8.5), framePos.y + cto(10));
		}
	},
	
	draw: function()
	{
		this.drawDropFileIcons();
		this.appColock++;
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
		w: document.getElementById('cellsize').value,
		h: document.getElementById('cellsize').value,
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


