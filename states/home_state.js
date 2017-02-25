var homeState = (function() {

  var create = function () {
    bacteriaFilter = new Phaser.Filter(this, null, config.bacteriaShaderStr);
    bacteriaFilter.setResolution(config.gameWidth, config.gameHeight);
    bacteriaSprite = this.add.sprite();
    bacteriaSprite.width = config.gameWidth;
    bacteriaSprite.height = config.gameHeight;
    bacteriaSprite.filters = [bacteriaFilter];
    bacteriaSprite.inputEnabled = true;
    bacteriaSprite.events.onInputDown.add(backgroundClicked, this);

    var textOptions = {
      font: '65px Arial',
      align: 'center',
      fill: '#ff8300'
    };
    var text = this.add.text(this.world.centerX, this.world.centerY,
      "Tap to Start", textOptions);
    text.anchor.setTo(0.5);
  };

  var update = function() {
    bacteriaFilter.update();
  };

  var backgroundClicked = function() {
    this.state.start('playState');
  };

  return {
    create: create,
    update: update
  };
})();