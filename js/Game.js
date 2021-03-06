var SideScroller = SideScroller || {};

SideScroller.Game = function(){};

SideScroller.Game.prototype = {
  preload: function() {
    this.game.time.advancedTiming = true;
  },

  monsterInfusions : {
    blob: function(cursors) {

        if (cursors.left.isDown) {
          this.player.body.velocity.x = -100;
        }

        if (cursors.right.isDown) {
          this.player.body.velocity.x = 100;
        }

        if (!cursors.left.isDown && !cursors.right.isDown) {
          this.player.body.velocity.x = 0;
        }
    },

    feet: function(cursors) {

        if (cursors.left.isDown) {
          this.player.body.velocity.x = -300;
        }

        if (cursors.right.isDown) {
          this.player.body.velocity.x = 300;
        }

        if (!cursors.left.isDown && !cursors.right.isDown) {
          this.player.body.velocity.x = 0;
        }
    },

    kangaroo: function(cursors) {

        if (cursors.left.isDown) {
          this.player.body.velocity.x = -300;
        }

        if (cursors.right.isDown) {
          this.player.body.velocity.x = 300;
        }

        if (!cursors.left.isDown && !cursors.right.isDown) {
          this.player.body.velocity.x = 0;
        }

        if(cursors.up.isDown) {
          this.playerJump();
        }
    },


    rhino: function(cursors) {
       if (cursors.left.isDown) {


          if (this.player.body.velocity.x > -300) {
            this.player.body.velocity.x = -300;
          }
          this.player.body.acceleration.x = -100;
        }

        if (cursors.right.isDown) {
          if (this.player.body.velocity.x < 300) {
            this.player.body.velocity.x = 300
          }
          this.player.body.acceleration.x = 100;
        }

        if (!cursors.left.isDown && !cursors.right.isDown) {
          this.player.body.acceleration.x = 0;
          if (this.player.body.velocity.x > 0) { //drag
            this.player.body.velocity.x -= 10;
          }
          if (this.player.body.velocity.x < 0) { //drag
            this.player.body.velocity.x += 10;
          }
        }

        if(cursors.up.isDown) {
          this.playerJump();
        }
     }
  },

  create: function() {
    this.map = this.game.add.tilemap('level1');

    //the first parameter is the tileset name as specified in Tiled, the second is the key to the asset
    this.map.addTilesetImage('tiles_spritesheet', 'gameTiles');

    //create layers
    this.backgroundlayer = this.map.createLayer('backgroundLayer');
    this.blockedLayer = this.map.createLayer('blockedLayer');

    //collision on blockedLayer
    this.map.setCollisionBetween(1, 5000, true, 'blockedLayer');

    //resizes the game world to match the layer dimensions
    this.backgroundlayer.resizeWorld();

    //create infusions
    this.createMonsterInfusion();

    //create player
    this.player = this.game.add.sprite(100, 957, 'player');

    //enable physics on the player
    this.game.physics.arcade.enable(this.player);

    //player gravity
    this.player.body.gravity.y = 1000;
    this.player.movement = this.monsterInfusions['blob'].bind(this);

    //properties when the player is ducked and standing, so we can use in update()
    var playerDuckImg = this.game.cache.getImage('playerDuck');
    this.player.duckedDimensions = {width: playerDuckImg.width, height: playerDuckImg.height};
    this.player.standDimensions = {width: this.player.width, height: this.player.height};
    this.player.anchor.setTo(0.5, 1);

    //the camera will follow the player in the world
    this.game.camera.follow(this.player);

    //move player with cursor keys
    this.cursors = this.game.input.keyboard.createCursorKeys();

    //sounds
    this.coinSound = this.game.add.audio('coin');
  },

  update: function() {
    //collision
    this.game.physics.arcade.collide(this.player, this.blockedLayer, this.playerHit, null, this);
    this.game.physics.arcade.overlap(this.player, this.infusions, this.collect, null, this);

    //only respond to keys and keep the speed if the player is alive
    if(this.player.alive) {

      this.player.movement(this.cursors)

      //restart the game if reaching the edge
      //if(this.player.x >= this.game.world.width) {
      //  this.game.state.start('Game');
      //}
    }
  },

  collect: function(player, collectable) {
    player.movement = collectable.modifyPlayer.bind(this);
    this.coinSound.play();
    collectable.destroy();
  },

  //create infusions
  createMonsterInfusion: function() {
    this.infusions = this.game.add.group();
    this.infusions.enableBody = true;
    var result = this.findObjectsByType('infusion', this.map, 'objectsLayer');
    result.forEach(function(element) {
      var infusion = this.createFromTiledObject(element, this.infusions);
      infusion.modifyPlayer = this.monsterInfusions[element.properties.infusion_type];
    }, this);
  },

  //find objects in a Tiled layer that containt a property called "type" equal to a certain value
   findObjectsByType: function(type, map, layerName) {
     var result = new Array();
     map.objects[layerName].forEach(function(element){
       if(element.properties.type === type) {
         //Phaser uses top left, Tiled bottom left so we have to adjust
         //also keep in mind that some images could be of different size as the tile size
         //so they might not be placed in the exact position as in Tiled
         element.y -= map.tileHeight;
         result.push(element);
       }
     });
     return result;
   },

  createFromTiledObject: function(element, group) {
    var sprite = group.create(element.x, element.y, element.properties.sprite);

    //copy all properties to the sprite
    Object.keys(element.properties).forEach(function(key){
      sprite[key] = element.properties[key];
    });
    return sprite;
  },

  gameOver: function() {
    this.game.state.start('Game');
  },

  playerJump: function() {
    if(this.player.body.blocked.down) {
      this.player.body.velocity.y -= 700;
    }
  },

  playerDuck: function() {
      //change image and update the body size for the physics engine
      this.player.loadTexture('playerDuck');
      this.player.body.setSize(this.player.duckedDimensions.width, this.player.duckedDimensions.height);

      //we use this to keep track whether it's ducked or not
      this.player.isDucked = true;
  },

  render: function() {
    // this.game.debug.text(this.game.time.fps || '--', 20, 70, "#00ff00", "40px Courier");
    // this.game.debug.bodyInfo(this.player, 0, 80);
  }
};
