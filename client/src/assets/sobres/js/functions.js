// class to hold card data
function CardData(name, rarity)
{
	this.name = name;
	this.rarity = rarity;
}

function buildCardArrays() {

	//Get five new card rolls
	var rolls = getCardDistribution();

	//If the card arrays aren't already filled...
	if (!this.common.length) {

		//Do an AJAX call to fill them
		$.ajax({
			url: json_card_set,
			dataType: 'text',
			success: function(data) {
				var json = $.parseJSON(data);
				$.each(json, function(i, cards) {

					//Ensure only expert cards from packs are added to each array
					if (cards.collectible == true) {
						if (cards.rarity == 'COMMON') {
							common.push(image_prefix + cards.id + image_postfix);
							common_name.push(cards.name);

							for(var x=0; x<2; x++)
							{
								total_cards_in_set.push(new CardData(cards.name, cards.rarity));
							}

							//alert(image_prefix + cards.id);
						}
						else if (cards.rarity == 'RARE') {
							rare.push(image_prefix + cards.id + image_postfix);
							rare_name.push(cards.name);

							for(var x=0; x<2; x++)
							{
								total_cards_in_set.push(new CardData(cards.name, cards.rarity));
							}
						}
						else if (cards.rarity == 'EPIC') {
							epic.push(image_prefix + cards.id + image_postfix);
							epic_name.push(cards.name);

							for(var x=0; x<2; x++)
							{
								total_cards_in_set.push(new CardData(cards.name, cards.rarity));
							}
						}
						else if (cards.rarity == 'LEGENDARY') {
							legendary.push(image_prefix + cards.id + image_postfix);
							legendary_name.push(cards.name);

							total_cards_in_set.push(new CardData(cards.name, cards.rarity));
						}
					}

				});

				//Pass all this data to getCards which will determine quality and build the image URLs
				getCards(rolls, common, rare, epic, legendary)
			}
		});

		//Otherwise, just proceed to getCards with the new rolls
	} else {
		getCards(rolls, common, rare, epic, legendary)
	}
};

function getCardDistribution() {

	//Initialize rolls array and set a flag for 'special' (rare or better) cards
	var rolls = [],
		special;

	//Loop to get 5 random integers between 1 and 100
	for (var i = 0; i < 5; i++) {
		rolls[i] = getRandomInt(1, 100);
		if (rolls[i] > 74) {
			special = true;
		}

		// Kludge to guarantee a rare that is also outside the range of epic or legendary
		if (i == 4 && !special) {
			rolls[i] += 100;
		}
	}

	//Randomizes the roll order so the fifth card isn't usually the best
	return shuffle(rolls);
};

//Function for getting a random number between 'min' and 'max'
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
};

//Function for randomizing the order of items in an array
function shuffle(o) {
	for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
};

//Function to do a string replacement on a portion of the image URL to show a golden card instead
String.prototype.goldenUpgrade = function(find, replace) {
	var replaceString = this;
	for (var i = 0; i < find.length; i++) {
		replaceString = replaceString.replace(find[i], replace[i]);
	}
	return replaceString;
};

//Function to determine the cards themselves and whether they are gold
function getCards(rolls, common, rare, epic, legendary) {
	var normal = ['/medium/', '.png'],
		golden = ['/animated/', '_premium.gif'],
		quality = [],
		cards = [];

	//Loop through all five card rolls
	for (i = 0; i < rolls.length; i++) {
		var tempCard;

		//If the card's roll is in the range of 1-74 (74% chance), it's a common
		if (rolls[i] < 75) {

			//Get the appropriate image URL from the common array
			var common_index = Math.floor(Math.random() * common.length);
			tempCard =  common[common_index];
			//tempCard = common[Math.floor(Math.random() * common.length)];
			for(var x=0; x<total_cards_in_set.length; x++)
			{
				if(total_cards_in_set[x].name == common_name[common_index])
				{
					total_cards_in_set.splice(x,1);
					break;
				}
			}
			//Do a roll to determine if the common is golden (supposedly 1/50 cards, 1/10 packs, or 2% overall)
			//If you get 3.7 commons per pack, and 10 packs is 37 commons, then 1 out of 37 should be golden (i.e. ~2.7% of commons are golden)
			if (getRandomInt(1, 37) == 37) {
				quality[i] = 'golden_common',
				cards[i] = tempCard.goldenUpgrade(normal, golden);
			} else {
				quality[i] = 'common';
				cards[i] = tempCard;
			}
		}

		//If the card's roll is in the range of 75-95 (21% chance), it's a rare
		//If the card's roll is greater than 100, it's also a rare due to the guarantee
		if ((rolls[i] > 74 && rolls[i] < 96) || rolls[i] > 100) {
			var rare_index = Math.floor(Math.random() * rare.length);
			tempCard = rare[rare_index];
			//tempCard = rare[Math.floor(Math.random() * rare.length)];

			for(var x=0; x<total_cards_in_set.length; x++)
			{
				if(total_cards_in_set[x].name == rare_name[rare_index])
				{
					total_cards_in_set.splice(x,1);
					break;
				}
			}
			//Do a roll to determine if the rare is golden (supposedly 1/100 cards, 1/20 packs, or 1% overall)
			//If you get roughly 1.1 rares per pack, and 20 packs is 22 rares, then 1 out of 22 should be golden (i.e. ~4.55% of rares are golden)
			//But then there's the 'rare guarantee,'' which skews this, so I'm arbitrarily lowering chances by ~25%... sigh...
			if (getRandomInt(1, 28) == 28) {
				quality[i] = 'golden_rare',
				cards[i] = tempCard.goldenUpgrade(normal, golden);
			} else {
				quality[i] = 'rare';
				cards[i] = tempCard;
			}
		}

		//If the card's roll is in the range of 96-99 (4% chance), it's an epic
		if (rolls[i] > 95 && rolls[i] < 100) {
			var epic_index = Math.floor(Math.random() * epic.length);
			tempCard = epic[epic_index];
			//tempCard = epic[Math.floor(Math.random() * epic.length)];

			for(var x=0; x<total_cards_in_set.length; x++)
			{
				if(total_cards_in_set[x].name == epic_name[epic_index])
				{
					total_cards_in_set.splice(x,1);
					break;
				}
			}

			//Do a roll to determine if the epic is golden (supposedly 1/400 cards, 1/80 packs, or 0.25% overall)
			//If you get roughly 0.2 epics per pack, and 80 packs is 16 epics, then 1/16 should be golden (i.e. ~6.25% of epics are golden)
			if (getRandomInt(1, 16) == 16) {
				quality[i] = 'golden_epic',
				cards[i] = tempCard.goldenUpgrade(normal, golden);
			} else {
				quality[i] = 'epic';
				cards[i] = tempCard;
			}
		}

		//If the card's roll is a perfect 100 (1% chance), it's a legendary
		if (rolls[i] == 100) {
			var legendary_index = Math.floor(Math.random() * legendary.length);
			tempCard = legendary[legendary_index];
			//tempCard = legendary[Math.floor(Math.random() * legendary.length)];

			for(var x=0; x<total_cards_in_set.length; x++)
			{
				if(total_cards_in_set[x].name == legendary_name[legendary_index])
				{
					total_cards_in_set.splice(x,1);
					break;
				}
			}

			//Do a roll to determine if the legendary is golden (supposedly 1/2000 cards, 1/400 packs, or 0.05% overall)
			//If you get roughly 0.05 legendaries per pack, and 400 packs is 20 legendaries, then 1/20 should be golden (i.e. ~5% of legendaries are golden)
			if (getRandomInt(1, 20) == 20) {
				quality[i] = 'golden_legendary',
				cards[i] = tempCard.goldenUpgrade(normal, golden);
			} else {
				quality[i] = 'legendary';
				cards[i] = tempCard;
			}
		}

	};

	//Send these results to the drawCards function, which will place the respective cards on the DOM
	drawCards(quality, cards);
};

function drawCards(quality, cards) {

	//mandamos las cartas al json de la BD
	var data = new FormData();
	var arr_pack = "";
  data.append(csrf_key, csrf_token);

  for (i = 0; i < cards.length; i++) {
  	if(i > 0){
  		arr_pack += "#";
  	}
		arr_pack+=(cards[i].substring(cards[i].lastIndexOf("/") + 1, cards[i].lastIndexOf(".")));
	}
  data.append("arr_cards", arr_pack);

	$.ajax({
      type: "POST",
      enctype: 'multipart/form-data',
      //url: '{{site.uri.public}}/torneo/p/{{target_tournament.id}}',
      url: url_pack,
      data: data,
      processData: false,
      contentType: false,
      cache: false,
      timeout: 600000,
      success: function (data) {
          packs = packs - 1;
          if(packs == 0){
          	$("#newPack").attr('disabled', true);
          }
      },
      error: function (e) {
          //window.location.reload(true);
          //alert("error");
      }
  });

	//For each element with the 'card' class, replace its front-facing image with one of the new URLs
	$(".front", ".pack").each(function(i, card){
		$(card).css("background-image", "url(" + cards[i] + ")");
		$(card).parent().attr("class", "card fechado");
		//necesito poner la rareza en el class para el brillo???
		$(card).parent().addClass(quality[i]);
  });

  //TODO Part�culas de brillo seg�n rareza
	//cardInteraction(quality);

};

function cardInteraction(quality) {

	//This variable will count the number of cards that have been clicked/shown each pack
	var cards_shown = 0;

	//For each card...
	$('.card').each(function(i) {

		//Start by clearing this card's flags
		this.turned = false, this.clicked = false;

		//Get this particular card's rarity
		var card_rarity;
		if (quality[i].indexOf('common') != -1)
			card_rarity = 'common';
		if (quality[i].indexOf('rare') != -1)
			card_rarity = 'rare';
		if (quality[i].indexOf('epic') != -1)
			card_rarity = 'epic';
		if (quality[i].indexOf('legendary') != -1)
			card_rarity = 'legendary';

		//When a card is hovered over...
		$(this).unbind('mouseenter').mouseenter(function() {

				//And it hasn't been turned over yet...
				if (!this.turned) {

					//Play the card mouseover sound
					/*
					this.card_hover = new Audio();
					this.card_hover.src = allAudio['card_hover'];
					this.card_hover.volume = volume;
					this.card_hover.play();
					*/
					//Then determine its rarity and set the background glow to the appropriate color
					var card_color;
					if (card_rarity == 'rare')
						card_color = '#0066ff';
					if (card_rarity == 'epic')
						card_color = '#cc33ff';
					if (card_rarity == 'legendary')
						card_color = '#ff8000';

					//Make it pretty, bitches (slightly enlarge the card and give it a hover glow)
					$(this).css({
						'transform': 'scale(1.15) rotate(0.0001deg)',
						'-webkit-transform': 'scale(1.15) ',
						'transition': 'transform 300ms',
						'-webkit-transition': '-webkit-transform 300ms'
					});
					$('.card_glow', this).css({
						'box-shadow': '0 0 75px ' + card_color,
						'transition': 'box-shadow 1000ms',
						'-webkit-transition': 'box-shadow 1000ms'
					});

				}

		})

		//When the user stops hovering over a card...
		.unbind('mouseleave').mouseleave(function() {
			if (!this.turned) {

				//Return it to its original size, and turn off the glow
				$(this).css({
					'transform': 'scale(1)',
					'-webkit-transform': 'scale(1)',
					'transition': 'transform 500ms',
					'-webkit-transition': '-webkit-transform 500ms'
				});
				$('.card_glow', this).css({
					'box-shadow': 'none',
					'transition': 'box-shadow 600ms',
					'-webkit-transition': 'box-shadow 600ms'
				});

				//Play a sound which denotes the user stopped hovering
				/*
				this.card_unhover = new Audio();
				this.card_unhover.src = allAudio['card_unhover'];
				this.card_unhover.volume = volume / 6;
				this.card_unhover.play();
				*/
			}
		})

		//When a card is clicked...
		.unbind('mousedown').mousedown(function(e) {

			/* Some initial particle effect tests...
			    emitter1.emit();
			    var stopEmit1 = setTimeout(function() {
			        emitter1.stopEmit();
			    }, 1000);
			*/

			//Set some flags for the element to prevent subsequent clicks and sound plays
			this.turned = true, this.clicked;
			if (this.turned && !this.clicked) {

				//Flag that the element has been clicked, and increment cards_shown
				this.clicked = true, cards_shown++;

				//Send the card's quality to be tallied for the stats panel
				tallyStats(quality[i]);

				//If all five cards have been revealed...
				if (cards_shown > 4) {

					//Then after a brief delay, show the 'Done' button and play its reveal sound
					setTimeout(function() {
						var done_reveal = new Audio();
						done_reveal.src = allAudio['done_reveal'];
						done_reveal.volume = volume;
						setTimeout(function() {
							$('#done').stop(true).fadeIn(750);
							done_reveal.play();

							// check if we have completed all the cards of a set
							checkRarity();
						}, 500);
					}, 500);

					$('#done').bind('mousedown').mousedown(function(e) {
						for(var i=0; i<aperturaCartas.length; i++){
							aperturaCartasTotal.push(aperturaCartas[i]);
						}
						aperturaCartas = [];
					});
				}

				//Play the appropriate card turn effect for the card's rarity
				var turn_rarity = new Audio();
				turn_rarity.src = allAudio['card_turn_over_'+card_rarity];
				turn_rarity.volume = volume / 8; //These are so damn loud
				setTimeout(function() {
					turn_rarity.play();
				}, 200);

				//Play the appropriate announcer quote for the card's rarity
				var announcer = new Audio();
				if (quality[i] != 'common') {
					announcer.src = allAudio['announcer_'+quality[i]];
					announcer.volume = volume / 4; //These are loud too
					announcer.play();
				}

				//Determine which side of the card the user clicked on
				var cardX = e.pageX - $(this).offset().left;
				if (cardX < 116) {
					//Have it turn from the left
					var backDir = '-180deg',
						frontDir = '0deg';
				} else {
					//Have it turn from the right
					var backDir	= '180deg',
						frontDir = '360deg';
				}

				//Turn the card around
				$('div.card_back', this).css({
					'transform': 'perspective(1000px) rotateY('+backDir+')',
					'-webkit-transform': 'perspective(1000px) rotateY('+backDir+')',
					//'-webkit-filter': 'drop-shadow(0 0 3px white)',
					'transition': 'transform 800ms ease-in-out 300ms',
					'-webkit-transition': '-webkit-transform 800ms ease-in-out 300ms'
					//'-webkit-transition': '-webkit-filter 1667ms 333ms'
				});
				$('div.card_front', this).css({
					'transform': 'perspective(1000px) rotateY('+frontDir+')',
					'-webkit-transform': 'perspective(1000px) rotateY('+frontDir+')',
					//'-webkit-filter': 'drop-shadow(0 0 0 white)',
					'transition': 'transform 800ms ease-in-out 300ms',
					'-webkit-transition': '-webkit-transform 800ms ease-in-out 300ms'
					//'-webkit-transition': '-webkit-filter 333ms 1667ms'
				});
				$('.card_glow', this).css({
					'box-shadow': 'none',
					'transition': 'box-shadow 600ms',
					'-webkit-transition': 'box-shadow 600ms'
				});

			}

		});

	});

};
