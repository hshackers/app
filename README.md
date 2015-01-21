# HS Hackers App

Our meetup app. Powered by @cordova, special thanks to @thinkmill.

Grab a release: https://github.com/hshackers/app/releases

## Installation

Dependencies: [node.js](http://nodejs.org)/[io.js](http://iojs.org)

Platform-specific Dependencies: XCode, Android SDK, Firefox Developer Edition, Windows Phone SDK

1. Install Cordova and Grunt.

  ```
  sudo npm install -g cordova grunt-cli
  ```

2. Clone this repo.

  ```
  git clone https://github.com/hshackers/app.git
  cd app
  ```
  
3. Install Grunt modules.
  
  ```
  cd source/grunt
  npm install
  ```
  
4. Run Grunt. This will compile the code and generate a www/ folder.

  ```
  grunt all
  ```
  
  To run Grunt in development mode (watching for file changes) run this instead:
  
  ```
  grunt watch
  ```
  
5. Add your platforms.
  
  Currently supported: iOS, Android, FirefoxOS
  
  Untested: WindowsPhone
  
  ```
  cordova platform add ios android
  ```
  
6. Build your app. This will generate your binaries and projects.

  ```
  cordova build
  ```
  
7. Run your app and follow the terminal prompt.

  ```
  cordova run ios
  cordova run android
  cordova run firefoxos
  ```

## Roadmap

- [ ] Mentor directory
- [ ] Chipotle and food settings
- [ ] Geofenced notifications
- [ ] Support for multiple cities
