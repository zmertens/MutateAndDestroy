(function() {
  "use strict";

  var gameWidth = 800;
  var gameHeight = 600;

  var columnsCount = 20;

  var spriteWidth = gameWidth / columnsCount;
  var spriteHeight = spriteWidth;

  var rowsCount = Math.floor((gameHeight / spriteHeight) / 2);

  var nucFac;
  var matched = false;

  var rt = null;

  var rowMan = null;

  var nrtiMan = null;

  var bacteriaFilter;
  var bacteriaSprite;

  var game = new Phaser.Game(gameWidth, gameHeight, Phaser.WEBGL,
    'SeqAndDestroy', 
	  { preload: preload, create: create, update: update, render: render });

  function preload() {
    game.load.image('Adenine', 'assets/A.png');
    game.load.image('Cytosine', 'assets/C.png');
    game.load.image('Guanine', 'assets/G.png');
    game.load.image('Uracil', 'assets/T.png');
    game.load.shader('bacteria', 'assets/bacteria.frag');
  }

  function create() {
    game.stage.backgroundColor = "#333333";
    game.physics.startSystem(Phaser.Physics.ARCADE);

    bacteriaFilter = new Phaser.Filter(game, null,
      game.cache.getShader('bacteria'));
    bacteriaFilter.setResolution(gameWidth, gameHeight);
    bacteriaSprite = game.add.sprite();
    bacteriaSprite.width = gameWidth;
    bacteriaSprite.height = gameHeight;
    bacteriaSprite.filters = [bacteriaFilter];
    bacteriaSprite.inputEnabled = true;
    bacteriaSprite.events.onInputDown.add(stageClicked, this);

    var factoryOptions = {
      game: game,
      spriteWidth: spriteWidth,
      spriteHeight: spriteHeight
    };
    nucFac = nucleobases.createNucleobaseFactory(factoryOptions);

    var rowManOptions = {
      game: game,
      columnsCount: columnsCount,
      rowsCount: rowsCount,
      columnWidth: spriteWidth,
      rowHeight: spriteHeight,
      elementConstructor: nucFac.createRandomNucleobase.bind(nucFac)
    };
    rowMan = rowManager.createRowManager(rowManOptions);

    var nrtiOptions = {
      game: game,
      nucFac: nucFac,
      gameWidth: gameWidth,
      gameHeight: gameHeight,
      columnWidth: spriteWidth,
      rowHeight: spriteHeight 
    };
    nrtiMan = nrtiManager.createNRTIManager(nrtiOptions);

    var rtOptions = {
      game: game,
      nucFac: nucFac,
      rowManager: rowMan,
      nrtiManager: nrtiMan,
      blockedCallback: rtBlockedCallback
    };

    rt = reverseTranscriptase.createReverseTranscriptase(rtOptions);
    rt.activate();

    nrtiMan.createNRTI();

    game.time.events.loop(Phaser.Timer.SECOND * 5, function() {
      addRow();
    });
  }

  function update() {
    bacteriaFilter.update();
    
    game.physics.arcade.overlap(nrtiMan.getNRTI(), rowMan.getActiveRow(),
      gridOverlapHandler, null, this);
    game.physics.arcade.overlap(nrtiMan.getNRTI(), rt.getComplementStrand(),
      dnaOverlapHandler, null, this);

    if (!matched) {
      checkMatches();
    }
  }

  function render() {
  }

  function gridOverlapHandler(nucleotide, rna) {
    nrtiMan.gridOverlapHandler();
  }

  function dnaOverlapHandler(dna, nrti) {
    nrtiMan.resetNRTI();
  }

  function matchedBase(obj1, obj2) {
    return nucleobases.rnaComplement(obj1.data.nucleobaseType) ===
      obj2.data.nucleobaseType;
  }

  function checkMatches() {
    if (nrtiMan.getNRTI().data.overlapping) {

      var nearestRNA;
      var column;
      for (column = 0; column < rowMan.getActiveRow().length; column++) {
        var rowRNA = rowMan.getActiveRow().getAt(column);

        if (floatCloseEnough(rowRNA.x, nrtiMan.getNRTI().x)) {
          nearestRNA = rowRNA;
          break;
        }
      }

      if (matchedBase(nrtiMan.getNRTI(), nearestRNA)) {
        matched = true;
        nearestRNA.data.matched = true;
      }
      else {
        nrtiMan.resetNRTI();
      }
    }
  }

  function rtBlockedCallback() {
    nrtiMan.resetNRTI();
    rowMan.nextRow();
    matched = false;
  }

  function addRow() {
    rowMan.addRow();
    rt.shiftDown();

    if (matched) {
      nrtiMan.getNRTI().y += spriteHeight;
    }
  }

  function stageClicked(sprite, pointer) {
    nrtiMan.moveNRTI(pointer.clientX, pointer.clientY);
  }

  function floatCloseEnough(a, b) {
    return Math.abs(a - b) < 0.0001;
  }

})();
