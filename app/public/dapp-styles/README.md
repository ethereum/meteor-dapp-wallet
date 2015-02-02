# Ðapp styles
*Version 0.1*

These styles give a simple basic layout for your Ðapps.

## Usage


### CSS
To use it as CSS file just link the css file from the `dist/` folder.


### LESS
To use it as less file, which would allow you to overwrite all constants
from the `constant.import.less`, link the `dapp-styles.less`.

### Meteor
To use it in a Meteor app add the `less` package:

    $ meteor add less

Copy this dapp-styles repo into your apps `public` folder
and link to the `dapp-styles.less` in the any of our less files in the project with:

    @import 'public/dapp-styles/dapp-styles.less';