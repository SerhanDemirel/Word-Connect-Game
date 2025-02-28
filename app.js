
class GameConfig {
    static CANVAS_WIDTH = 800;
    static CANVAS_HEIGHT = 600;
    static BG_COLOR = 0x2c3e50; 
    static GRID_SIZE = 40; 
    static LETTER_RADIUS = 35;
    static LETTER_COLOR = 0xecf0f1; 
    static LETTER_SELECTED_COLOR = 0x3498db; 
    static LINE_COLOR = 0xe74c3c; 
    static LINE_THICKNESS = 6;
    static GLOW_DISTANCE = 15;
    static GLOW_OUTER_STRENGTH = 3;
    static GLOW_COLOR = 0x3498db;
}


class WordData {
    constructor(word, x, y, direction) {
        this.word = word;
        this.x = x;
        this.y = y;
        this.direction = direction; 
        this.found = false;
    }
}


class Letter extends PIXI.Container {
    constructor(letter, x, y) {
        super();
        this.letter = letter;
        this.x = x;
        this.y = y;
        this.selected = false;
        this.setup();
        this.setupGlow();
    }

    setup() {
     
        this.circle = new PIXI.Graphics();
        this.drawCircle(GameConfig.LETTER_COLOR);
        this.addChild(this.circle);

      
        const text = new PIXI.Text(this.letter, {
            fontFamily: 'Arial Bold',
            fontSize: 36,
            fill: 0x2c3e50,
            fontWeight: 'bold'
        });
        text.anchor.set(0.5);
        this.addChild(text);

     
        this.interactive = true;
        this.buttonMode = true;

     
        this.on('pointerover', () => {
            if (!this.selected) {
                gsap.to(this.scale, { x: 1.1, y: 1.1, duration: 0.2 });
            }
        });

        this.on('pointerout', () => {
            if (!this.selected) {
                gsap.to(this.scale, { x: 1, y: 1, duration: 0.2 });
            }
        });
    }

    setupGlow() {
        this.glow = new PIXI.Graphics();
        this.drawGlow();
        this.glow.alpha = 0;
        this.addChildAt(this.glow, 0);
    }

    drawCircle(color) {
        this.circle.clear();
        this.circle.lineStyle(3, 0x2c3e50, 0.3);
        this.circle.beginFill(color);
        this.circle.drawCircle(0, 0, GameConfig.LETTER_RADIUS);
        this.circle.endFill();
    }

    drawGlow() {
        this.glow.clear();
        this.glow.beginFill(GameConfig.GLOW_COLOR, 0.3);
        this.glow.drawCircle(0, 0, GameConfig.LETTER_RADIUS + GameConfig.GLOW_DISTANCE);
        this.glow.endFill();
    }

    setSelected(selected) {
        this.selected = selected;
        if (selected) {
            gsap.to(this.glow, { alpha: 1, duration: 0.2 });
            this.drawCircle(GameConfig.LETTER_SELECTED_COLOR);
        } else {
            gsap.to(this.glow, { alpha: 0, duration: 0.2 });
            this.drawCircle(GameConfig.LETTER_COLOR);
        }
    }
}


class WordConnectGame {
    constructor() {
        this.app = new PIXI.Application({
            width: GameConfig.CANVAS_WIDTH,
            height: GameConfig.CANVAS_HEIGHT,
            backgroundColor: GameConfig.BG_COLOR,
            resolution: window.devicePixelRatio || 1,
        });

        this.levelData = {
            letters: "G,O,D,L".split(','),
            words: [
                new WordData("GOLD", 0, 0, "H"),
                new WordData("GOD", 0, 0, "V"),
                new WordData("DOG", 2, 0, "H"),
                new WordData("LOG", 0, 2, "V")
            ]
        };

        this.gameContainer = new PIXI.Container();
        this.letterContainer = new PIXI.Container();
        this.lineGraphics = new PIXI.Graphics();
        this.wordListContainer = new PIXI.Container();
        
        this.selectedLetters = [];
        this.currentWord = "";
        this.foundWords = [];
        this.isDragging = false;

        this.init();
    }

    init() {
        document.getElementById('gameContainer').appendChild(this.app.view);
        this.app.stage.addChild(this.gameContainer);
        this.gameContainer.addChild(this.letterContainer);
        this.gameContainer.addChild(this.lineGraphics);
        this.gameContainer.addChild(this.wordListContainer);

        this.createLetterGrid();
        this.createWordList();
        this.setupEventListeners();
    }

    createLetterGrid() {
        const centerX = GameConfig.CANVAS_WIDTH / 2;
        const centerY = GameConfig.CANVAS_HEIGHT / 2;
        const radius = 100;

        this.levelData.letters.forEach((letter, index) => {
            const angle = (index / this.levelData.letters.length) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            const letterObj = new Letter(letter, x, y);
            this.letterContainer.addChild(letterObj);
        });
    }

    createWordList() {
        const style = {
            fontFamily: 'Arial',
            fontSize: 28,
            fill: 0xecf0f1,
            fontWeight: 'bold'
        };

       
        const title = new PIXI.Text('Kelimeler:', {
            ...style,
            fontSize: 32
        });
        title.x = 50;
        title.y = 20;
        this.wordListContainer.addChild(title);

      
        this.levelData.words.forEach((wordData, index) => {
            const container = new PIXI.Container();
            
          
            const bg = new PIXI.Graphics();
            bg.beginFill(0x34495e, 0.3);
            bg.drawRoundedRect(0, 0, 120, 40, 10);
            bg.endFill();
            container.addChild(bg);

          
            const text = new PIXI.Text('____', style);
            text.x = bg.width / 2;
            text.y = bg.height / 2;
            text.anchor.set(0.5);
            text.wordData = wordData;
            container.addChild(text);

            container.x = 50;
            container.y = 70 + index * 50;
            this.wordListContainer.addChild(container);
        });
    }

    setupEventListeners() {
        this.letterContainer.children.forEach(letter => {
            letter
                .on('pointerdown', () => {
                    this.isDragging = true;
                    this.onLetterDown(letter);
                })
                .on('pointerover', () => {
                    if (this.isDragging) {
                        this.onLetterOver(letter);
                    }
                });
        });

        
        document.addEventListener('pointerup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.checkWord();
                this.resetSelection();
            }
        });
    }

    onLetterDown(letter) {
        this.selectedLetters = [letter];
        letter.setSelected(true);
        this.currentWord = letter.letter;
        this.drawLines();
    }

    onLetterOver(letter) {
        if (!this.selectedLetters.includes(letter)) {
            this.selectedLetters.push(letter);
            letter.setSelected(true);
            this.currentWord += letter.letter;
            this.drawLines();
        }
    }

    drawLines() {
        this.lineGraphics.clear();
        this.lineGraphics.lineStyle(GameConfig.LINE_THICKNESS, GameConfig.LINE_COLOR);

        for (let i = 1; i < this.selectedLetters.length; i++) {
            const prevLetter = this.selectedLetters[i - 1];
            const currentLetter = this.selectedLetters[i];
            
            this.lineGraphics.moveTo(prevLetter.x, prevLetter.y);
            this.lineGraphics.lineTo(currentLetter.x, currentLetter.y);
        }
    }

    checkWord() {
        const word = this.currentWord;
        const matchingWord = this.levelData.words.find(w => w.word === word && !w.found);
        
        if (matchingWord) {
            matchingWord.found = true;
            this.foundWords.push(word);
            this.onWordFound(word);
            
            if (this.foundWords.length === this.levelData.words.length) {
                this.onGameComplete();
            }
        }
    }

    resetSelection() {
        this.selectedLetters.forEach(letter => letter.setSelected(false));
        this.selectedLetters = [];
        this.currentWord = "";
        this.lineGraphics.clear();
    }

    onWordFound(word) {
        
        this.wordListContainer.children.forEach(container => {
            if (container.children[1]?.wordData?.word === word) {
                const text = container.children[1];
                text.text = word;
                
              
                gsap.from(container.scale, {
                    x: 1.2,
                    y: 1.2,
                    duration: 0.3,
                    ease: "back.out"
                });
                
               
                const flash = new PIXI.Graphics();
                flash.beginFill(0xffffff);
                flash.drawRoundedRect(0, 0, 120, 40, 10);
                flash.endFill();
                flash.alpha = 0.8;
                container.addChildAt(flash, 1);
                
                gsap.to(flash, {
                    alpha: 0,
                    duration: 0.5,
                    onComplete: () => container.removeChild(flash)
                });
            }
        });

     
        const foundText = new PIXI.Text(word, {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0x2ecc71,
            fontWeight: 'bold',
            stroke: 0xffffff,
            strokeThickness: 4
        });
        foundText.x = GameConfig.CANVAS_WIDTH / 2;
        foundText.y = GameConfig.CANVAS_HEIGHT / 2;
        foundText.anchor.set(0.5);
        this.gameContainer.addChild(foundText);

        gsap.to(foundText, {
            y: foundText.y - 100,
            alpha: 0,
            duration: 1,
            ease: "power2.out",
            onComplete: () => {
                this.gameContainer.removeChild(foundText);
            }
        });
    }

    onGameComplete() {
        
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, GameConfig.CANVAS_WIDTH, GameConfig.CANVAS_HEIGHT);
        overlay.endFill();
        overlay.alpha = 0;
        this.gameContainer.addChild(overlay);

        
        const completeText = new PIXI.Text('Tebrikler!\nTüm kelimeleri buldunuz!', {
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xf1c40f,
            align: 'center',
            fontWeight: 'bold',
            stroke: 0xffffff,
            strokeThickness: 6
        });
        completeText.x = GameConfig.CANVAS_WIDTH / 2;
        completeText.y = GameConfig.CANVAS_HEIGHT / 2;
        completeText.anchor.set(0.5);
        completeText.alpha = 0;
        this.gameContainer.addChild(completeText);

       
        gsap.to(overlay, {
            alpha: 1,
            duration: 0.5
        });

        gsap.to(completeText, {
            alpha: 1,
            y: GameConfig.CANVAS_HEIGHT / 2 - 20,
            duration: 0.5,
            delay: 0.3,
            ease: "back.out"
        });
    }
}

window.onload = () => {
    const game = new WordConnectGame();
}; 