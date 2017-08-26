'use strict';

const Alexa = require('alexa-sdk');
const yelp = require('yelp-fusion');

const APP_ID = "amzn1.ask.skill.f081cc3a-debc-4262-89eb-1febf67cbf92";

const clientId = "_nFYCglKH6osLaYdo82trA";
const clientSecret = "ZsZuB9uXnkgFmyfFAUJ7zDYjC6MzHr8q2MW7MsM2OiIQ6fiDFoAaygW2whInrzVp";


var SKILL_NAME = 'Find Food';
var STOP_MESSAGE = 'Thanks for using Find Food!';

var yelp_search = function (options, cb) {
    var client;
    yelp.accessToken(clientId, clientSecret).then(response => {
        client = yelp.client(response.jsonBody.access_token);
        var searchRequest = {
        term: options.foodtype,
        location: options.userLocation,
        sort_by: options.sort_by
    }
    client.search( searchRequest ).then(response => {
        cb(response.jsonBody.businesses[options.yelpOptionNumber]);
    });
    }).catch(e => {
        this.emit(':tell', 'Cannot connect to yelp. Please try again later.');
    });
}

var searchOptions = {
    foodtype: undefined,
    userLocation: undefined,
    yelpOptionNumber: 0,
    sort_by: 'best_match'
}

var resetSearchOptions = function () {
    searchOptions.foodtype = undefined;
    searchOptions.userLocation = undefined;
    searchOptions.yelpOptionNumber = 0;
    searchOptions.sort_by = 'best_match';
}


exports.handler = function(event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(newSessionHandlers, locHandlers, foodTypeHandlers, searchRestaurantHandlers);
    alexa.execute();
};

var states = {
    LOCATIONMODE: '_LOCATIONMODE',
    FOODTYPEMODE: '_FOODTYPEMODE',
    SEARCHRESTAURANTMODE: '_SEARCHRESTAURANTMODE'
};

var newSessionHandlers = {
    'WhatToEatIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        if ((this.event.request.intent.slots.food.value !== undefined) || (this.event.request.intent.slots.mealtype.value !== undefined) ) {
            if (this.event.request.intent.slots.food.value !== undefined) {
                searchOptions.foodtype = (this.event.request.intent.slots.food.value);
            } else {
                searchOptions.foodtype = (this.event.request.intent.slots.mealtype.value);
            }
            if (this.event.request.intent.slots.number.value !== undefined) {
                searchOptions.userLocation = this.event.request.intent.slots.number.value;
                this.handler.state = states.SEARCHRESTAURANTMODE;
                yelpQuery(this, searchOptions);
            } else if (this.event.request.intent.slots.us_city.value !== undefined) {
                searchOptions.userLocation = this.event.request.intent.slots.us_city.value;
                this.handler.state = states.SEARCHRESTAURANTMODE;
                yelpQuery(this, searchOptions);
            } else {
                this.handler.state = states.LOCATIONMODE;
                this.emit(':ask', 'What is your location?', 'You can either say a city or a zip code.');
            }
        } else {
            if (this.event.request.intent.slots.number.value !== undefined) {
                searchOptions.userLocation = this.event.request.intent.slots.number.value;
                this.handler.state = states.FOODTYPEMODE;
                this.emit(':ask', 'What type of food or meal do you want in '+ searchOptions.userLocation + '?');
            } else if (this.event.request.intent.slots.us_city.value !== undefined) {
                searchOptions.userLocation = this.event.request.intent.slots.us_city.value;
                this.handler.state = states.FOODTYPEMODE;
                this.emit(':ask', 'What type of food do you want in ' + searchOptions.userLocation + '?');
            } else {
                this.handler.state = states.LOCATIONMODE;
                this.emit(':ask', 'What is your location?', 'You can either say a city or a zip code.');
            }
        }
    },
    'LaunchRequest': function() {
        this.emit(':ask', 'Find Food can help you find a great place to eat. For example, you can say "dinner in Seattle" or "where should I go for pizza in Austin".');
    },
    'AMAZON.HelpIntent': function() {
        this.handler.state = states.LOCATIONMODE;
        this.emit(':ask', 'I\'ll help you find a place to eat, where are you located?', 'You can either say a city or a zip code.');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', STOP_MESSAGE);
    },
    'Unhandled': function () {
        this.handler.state = states.LOCATIONMODE;
        this.emit(':ask','I didn\'t understand that, where are you located?','You can either say a city or a zip code.');
    }
};

var locHandlers = Alexa.CreateStateHandler(states.LOCATIONMODE, {
    'SetLocationIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        if (this.event.request.intent.slots.us_city.value !== undefined) {
            searchOptions.userLocation = this.event.request.intent.slots.us_city.value;    
        } else if (this.event.request.intent.slots.number.value !== undefined) {
            searchOptions.userLocation = this.event.request.intent.slots.number.value;    
        }
        if (searchOptions.foodtype !== undefined) {
            this.handler.state = states.SEARCHRESTAURANTMODE;
            yelpQuery(this, searchOptions);
        } else {
            this.handler.state = states.FOODTYPEMODE;
            this.emit(':ask', 'That can be changed later if you want to. What type of food are you looking for in ' + searchOptions.userLocation + '?');
        }
    },
    'ChangeLocationIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        if (this.event.request.intent.slots.us_city.value !== undefined) {
            searchOptions.userLocation = this.event.request.intent.slots.us_city.value;    
        } else if (this.event.request.intent.slots.number.value !== undefined) {
            searchOptions.userLocation = this.event.request.intent.slots.number.value;    
        }
        if (searchOptions.foodtype !== undefined) {
            this.handler.state = states.SEARCHRESTAURANTMODE;
            yelpQuery(this, searchOptions);
        } else {
            this.handler.state = states.FOODTYPEMODE;
            this.emit(':ask', 'That can be changed later if you want to. What type of food are you looking for in ' + searchOptions.userLocation + '?');
        }
    },
    'AMAZON.StopIntent': function() {
        resetSearchOptions();
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.CancelIntent': function () {
        resetSearchOptions();
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.HelpIntent': function() {
        this.handler.state = states.LOCATIONMODE;
        this.emit(':ask', 'Where are you located?', 'You can either say a city or a zip code.');
    },
    'Unhandled': function () {
        this.handler.state = states.LOCATIONMODE;
        this.emit(':ask','I didn\'t understand that, where are you located?', 'You can either say a city or a zip code.');
    }
});


var foodTypeHandlers = Alexa.CreateStateHandler(states.FOODTYPEMODE, {
    'FoodTypeIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        searchOptions.foodtype = this.event.request.intent.slots.food.value;
        if (searchOptions.userLocation !== undefined) {
            this.handler.state = states.SEARCHRESTAURANTMODE;
            yelpQuery(this, searchOptions);
        } else {
            this.handler.state = states.LOCATIONMODE;
            this.emit(':ask', 'That can be changed later if you want. What is your location?', 'You can either say a city or a zip code.');
        }
    },
    'FoodTypeMealTypeIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        searchOptions.foodtype = this.event.request.intent.slots.mealtype.value;
        if (searchOptions.userLocation !== undefined) {
            this.handler.state = states.SEARCHRESTAURANTMODE;
            yelpQuery(this, searchOptions);
        } else {
            this.handler.state = states.LOCATIONMODE;
            this.emit(':ask', 'What is your location?', 'You can either say a city or a zip code.');
        }
    },
    'ChangeFoodIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        searchOptions.foodtype = (this.event.request.intent.slots.food.value != null) ?
             this.event.request.intent.slots.food.value :
             this.event.request.intent.slots.mealtype.value;
        if (searchOptions.userLocation !== undefined) {
            this.handler.state = states.SEARCHRESTAURANTMODE;
            yelpQuery(this, searchOptions);
        } else {
            this.handler.state = states.LOCATIONMODE;
            this.emit(':ask', 'What is your location?', 'You can either say a city or a zip code.');
        }
    },
    'AMAZON.StopIntent': function() {
        resetSearchOptions();
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.CancelIntent': function () {
        resetSearchOptions();
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.HelpIntent': function() {
        this.handler.state = states.FOODTYPEMODE;
        this.emit(':ask', 'What kind of food are you looking for in ' + searchOptions.userLocation + '?');
    },
    'Unhandled': function () {
        this.handler.state = states.FOODTYPEMODE;
        this.emit(':ask','Sorry, I didn\'t understand that. What kind of food are you looking for?', 'Try using the full names of food, like say hamburger instead of burger.');
    }
});

var searchRestaurantHandlers = Alexa.CreateStateHandler(states.SEARCHRESTAURANTMODE, {
    'AMAZON.NextIntent': function() {
        searchOptions.yelpOptionNumber++;
        yelpQuery(this, searchOptions);
    },
    'AMAZON.PreviousIntent': function() {
        if (searchOptions.yelpOptionNumber !== 0) {
            searchOptions.yelpOptionNumber--;
            yelpQuery(this, searchOptions);
        } else {
            this.emit(':ask', 'First option.');
        }
    },
    'AMAZON.RepeatIntent': function() {
        yelpQuery(this, searchOptions);
    },
    'ChangeLocationIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        if (this.event.request.intent.slots.us_city.value !== undefined) {
            searchOptions.userLocation = this.event.request.intent.slots.us_city.value;    
        } else if (this.event.request.intent.slots.number.value !== undefined) {
            searchOptions.userLocation = this.event.request.intent.slots.number.value;    
        }
        yelpQuery(this, searchOptions);
    },
    'ChangeFoodIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        if (this.event.request.intent.slots.food.value !== undefined) {
            searchOptions.foodtype = this.event.request.intent.slots.food.value;    
        } else if (this.event.request.intent.slots.mealtype.value !== undefined) {
            searchOptions.userLocation = this.event.request.intent.slots.mealtype.value;    
        }
        yelpQuery(this, searchOptions);
    },
    'SortByIntent': function() {
        searchOptions.yelpOptionNumber = 0;
        var sort_by = this.event.request.intent.slots.sortbytype.value;
        searchOptions.sort_by = sort_by.replace(/ /g, "_");
        yelpQuery(this, searchOptions);
    },
    'StartOverIntent': function() {
        this.handler.state = states.LOCATIONMODE;
        resetSearchOptions();
        this.emit(':ask', 'What is your location?');
    },
    'AMAZON.StopIntent': function() {
        resetSearchOptions();
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.CancelIntent': function () {
        resetSearchOptions();
        this.emit(':tell', STOP_MESSAGE);
    },
    'AMAZON.HelpIntent': function() {
        this.emit(':ask', 'Can change you food preference, your location, the sorting of the list, or say: next, previous, or repeat.');
    },
    'Unhandled': function () {
        this.emit(':ask','I didn\'t understand that.');
    }
});


var yelpQuery = function(context, options) {
    yelp_search(options, formatAndOutput());
};

var formatAndOutput = function () {
    var func =  function (yelpResponse){
        var rating;
        var review_count;
        if (yelpResponse.rating !== undefined) { //RATING
            rating = yelpResponse.rating;
            review_count = yelpResponse.review_count;
        } else {
            rating = 'unknown';
        }

        var price;
        if (yelpResponse.price !== undefined) { //PRICE
            switch (yelpResponse.price.length) {
                case 1:
                    price = 'cheap';
                    break;
                case 2:
                case 3: 
                    price = 'moderate';
                    break;
                case 4:
                    price = 'expensive';
                    break;
                default:
                    price = 'unknown';
            }
        } else {
            price = 'unknown';
        }
        var tags = ' ';
        if (yelpResponse.categories !== undefined) { //TAGS
            yelpResponse.categories.forEach((tag, ind, arr) => {
                if (ind === 0) {
                    tags += tag.title + ',';
                } else if (ind === (arr.length - 1)) {
                    tags += ' and ' + tag.title;
                } else {
                    tags += ' ' + tag.title + ',';
                }
            });

        } else {
            tags = '';
        }
        

        var outputString = yelpResponse.name + '. ';
        outputString += 'Rating is ' + rating + ' from ' + review_count + ' people. ';
        outputString += 'Price is ' + price + '. ';
        outputString += (tags.length !== 0) ? 'Tags are ' + tags + '.' : '';
        outputString = outputString.replace(/&/g, 'and');
        outputString += ' You can say next, previous, or repeat. You can also change your location, food choice, or sorting order.';
        context.emit(':ask', outputString,'You can say next, previous, or repeat. You can also change your location, food choice, or sorting order.');
    }

    return func;
}

