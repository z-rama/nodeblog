var currentBackground,
  backgrounds = [
    'http://powellong.com/data/wallpapers/141/WDF_1821520.jpg',
    'http://wallpapercave.com/wp/4Wx8yEp.jpg',
    'http://i.imgur.com/sWf97Lg.jpg'
  ];

currentBackground = Math.floor(Math.random() * backgrounds.length);
document.getElementsByClassName('bg')[0].src = backgrounds[currentBackground];
document.getElementsByClassName('form-bg')[0].src = backgrounds[currentBackground];