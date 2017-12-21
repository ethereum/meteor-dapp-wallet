```s
├── check@1.2.5 (top level)
├─┬ coffeescript@1.0.17
│ ├─┬ caching-compiler@1.1.9
│ │ ├─┬ ecmascript@0.9.0
│ │ │ ├─┬ babel-compiler@6.24.7
│ │ │ │ └─┬ ecmascript-runtime@0.5.0
│ │ │ │   ├─┬ ecmascript-runtime-client@0.5.0
│ │ │ │   │ ├─┬ modules@0.11.2
│ │ │ │   │ │ └── modules-runtime@0.9.1
│ │ │ │   │ └─┬ promise@0.10.0
│ │ │ │   │   └── modules@0.11.2 (expanded above)
│ │ │ │   └─┬ ecmascript-runtime-server@0.5.0
│ │ │ │     └── modules@0.11.2 (expanded above)
│ │ │ ├─┬ babel-runtime@1.1.1
│ │ │ │ ├── modules@0.11.2 (expanded above)
│ │ │ │ └── promise@0.10.0 (expanded above)
│ │ │ ├── ecmascript-runtime@0.5.0 (expanded above)
│ │ │ ├── modules@0.11.2 (expanded above)
│ │ │ └── promise@0.10.0 (expanded above)
│ │ └── random@1.0.10 (top level)
│ └── ecmascript@0.9.0 (expanded above)
├─┬ templating@1.3.2
│ ├─┬ templating-compiler@1.3.3
│ │ ├─┬ caching-html-compiler@1.1.2
│ │ │ ├── caching-compiler@1.1.9 (expanded above)
│ │ │ ├── ecmascript@0.9.0 (expanded above)
│ │ │ ├─┬ templating-tools@1.1.2
│ │ │ │ ├── ecmascript@0.9.0 (expanded above)
│ │ │ │ ├─┬ spacebars-compiler@1.1.3
│ │ │ │ │ ├─┬ blaze-tools@1.0.10
│ │ │ │ │ │ ├─┬ htmljs@1.0.11
│ │ │ │ │ │ │ └─┬ deps@1.0.12
│ │ │ │ │ │ │   └── tracker@1.1.3
│ │ │ │ │ │ └── underscore@1.0.10
│ │ │ │ │ ├─┬ html-tools@1.0.11
│ │ │ │ │ │ └── htmljs@1.0.11 (expanded above)
│ │ │ │ │ ├── htmljs@1.0.11 (expanded above)
│ │ │ │ │ └── underscore@1.0.10
│ │ │ │ └── underscore@1.0.10
│ │ │ └── underscore@1.0.10
│ │ ├── ecmascript@0.9.0 (expanded above)
│ │ └── templating-tools@1.1.2 (expanded above)
│ └─┬ templating-runtime@1.3.2
│   ├─┬ blaze@2.3.2
│   │ ├── check@1.2.5 (top level)
│   │ ├── htmljs@1.0.11 (expanded above)
│   │ ├── jquery@1.11.10 (top level)
│   │ ├─┬ observe-sequence@1.0.16
│   │ │ ├─┬ diff-sequence@1.0.7
│   │ │ │ ├── ejson@1.1.0 (top level)
│   │ │ │ └── underscore@1.0.10
│   │ │ ├─┬ mongo-id@1.0.6
│   │ │ │ ├── ejson@1.1.0 (top level)
│   │ │ │ ├─┬ id-map@1.0.9
│   │ │ │ │ ├── ejson@1.1.0 (top level)
│   │ │ │ │ └── underscore@1.0.10
│   │ │ │ └── random@1.0.10 (top level)
│   │ │ ├── random@1.0.10 (top level)
│   │ │ ├── tracker@1.1.3
│   │ │ └── underscore@1.0.10
│   │ ├─┬ ordered-dict@1.0.9
│   │ │ └── underscore@1.0.10
│   │ ├─┬ reactive-var@1.0.11
│   │ │ └── tracker@1.1.3
│   │ ├── tracker@1.1.3
│   │ └── underscore@1.0.10
│   ├── spacebars@1.0.15 (top level)
│   ├── templating-compiler@1.3.3 (expanded above)
│   └── underscore@1.0.10
├── underscore@1.0.10
└─┬ zimme:active-route@2.3.2
  ├── check@1.2.5 (top level)
  ├── coffeescript@1.0.17 (expanded above)
  ├─┬ reactive-dict@1.2.0
  │ ├── ecmascript@0.9.0 (expanded above)
  │ ├── ejson@1.1.0 (top level)
  │ ├── tracker@1.1.3
  │ └── underscore@1.0.10
  └── underscore@1.0.10
blaze-html-templates@1.1.2
├── blaze@2.3.2 (expanded above)
├── spacebars@1.0.15 (top level)
├── templating@1.3.2 (expanded above)
└─┬ ui@1.0.13
  └── blaze@2.3.2 (expanded above)
check@1.2.5
├── ejson@1.1.0 (top level)
├── modules@0.11.2 (expanded above)
└── underscore@1.0.10
chuangbo:cookie@1.1.0
dynamic-import@0.2.1
├── check@1.2.5 (top level)
├─┬ ddp@1.4.0
│ ├─┬ ddp-client@2.2.0
│ │ ├─┬ callback-hook@1.0.10
│ │ │ └── underscore@1.0.10
│ │ ├── check@1.2.5 (top level)
│ │ ├─┬ ddp-common@1.3.0
│ │ │ ├── check@1.2.5 (top level)
│ │ │ ├── ejson@1.1.0 (top level)
│ │ │ ├── random@1.0.10 (top level)
│ │ │ ├─┬ retry@1.0.9
│ │ │ │ ├── random@1.0.10 (top level)
│ │ │ │ └── underscore@1.0.10
│ │ │ ├── tracker@1.1.3
│ │ │ └── underscore@1.0.10
│ │ ├── diff-sequence@1.0.7 (expanded above)
│ │ ├── ecmascript@0.9.0 (expanded above)
│ │ ├── ejson@1.1.0 (top level)
│ │ ├── id-map@1.0.9 (expanded above)
│ │ ├── mongo-id@1.0.6 (expanded above)
│ │ ├── random@1.0.10 (top level)
│ │ ├── retry@1.0.9 (expanded above)
│ │ ├── tracker@1.1.3
│ │ └── underscore@1.0.10
│ └─┬ ddp-server@2.1.1
│   ├── callback-hook@1.0.10 (expanded above)
│   ├── check@1.2.5 (top level)
│   ├── ddp-client@2.2.0 (expanded above)
│   ├── ddp-common@1.3.0 (expanded above)
│   ├── diff-sequence@1.0.7 (expanded above)
│   ├── ecmascript@0.9.0 (expanded above)
│   ├── ejson@1.1.0 (top level)
│   ├─┬ minimongo@1.4.3
│   │ ├── diff-sequence@1.0.7 (expanded above)
│   │ ├── ecmascript@0.9.0 (expanded above)
│   │ ├── ejson@1.1.0 (top level)
│   │ ├─┬ geojson-utils@1.0.10
│   │ │ └── modules@0.11.2 (expanded above)
│   │ ├── id-map@1.0.9 (expanded above)
│   │ ├── mongo-id@1.0.6 (expanded above)
│   │ ├── ordered-dict@1.0.9 (expanded above)
│   │ ├── random@1.0.10 (top level)
│   │ └── tracker@1.1.3
│   ├── mongo-id@1.0.6 (expanded above)
│   ├── random@1.0.10 (top level)
│   ├── retry@1.0.9 (expanded above)
│   ├─┬ routepolicy@1.0.12
│   │ ├── underscore@1.0.10
│   │ └─┬ webapp@1.4.0
│   │   ├─┬ boilerplate-generator@1.3.1
│   │   │ ├── ecmascript@0.9.0 (expanded above)
│   │   │ └── underscore@1.0.10
│   │   ├── ecmascript@0.9.0 (expanded above)
│   │   ├── logging@1.1.19 (top level)
│   │   ├── routepolicy@1.0.12 (expanded above)
│   │   ├── underscore@1.0.10
│   │   └─┬ webapp-hashing@1.0.9
│   │     ├── ecmascript@0.9.0 (expanded above)
│   │     └── underscore@1.0.10
│   ├── underscore@1.0.10
│   └── webapp@1.4.0 (expanded above)
├── ecmascript@0.9.0 (expanded above)
├── modules@0.11.2 (expanded above)
└── promise@0.10.0 (expanded above)
ejson@1.1.0
├── base64@1.0.10
└── ecmascript@0.9.0 (expanded above)
ethereum:blocks@0.3.2
├── ethereum:web3@0.20.2
├── mongo@1.3.1 (top level)
└── underscore@1.0.10
ethereum:dapp-styles@0.5.8
└── less@2.7.11 (top level)
ethereum:elements@0.7.17
├─┬ 3stack:bignumber@2.0.7
│ └─┬ cosmos:browserify@0.5.1
│   ├── coffeescript@1.0.17 (expanded above)
│   └── underscore@1.0.10
├── alexvandesande:identicon@2.0.2
├─┬ ethereum:tools@0.7.0
│ ├── 3stack:bignumber@2.0.7 (expanded above)
│ ├── ethereum:web3@0.20.2
│ ├─┬ frozeman:persistent-minimongo@0.1.8
│ │ ├─┬ amplify@1.0.0
│ │ │ └── jquery@1.11.10 (top level)
│ │ └── underscore@1.0.10
│ ├── frozeman:storage@0.1.9 (top level)
│ ├── http@1.3.0 (top level)
│ ├── mongo@1.3.1 (top level)
│ ├── spacebars@1.0.15 (top level)
│ ├── templating@1.3.2 (expanded above)
│ ├── tracker@1.1.3
│ └── underscore@1.0.10
├── ethereum:web3@0.20.2
├── frozeman:animation-helper@0.2.6 (top level)
├── frozeman:storage@0.1.9 (top level)
├── frozeman:template-var@1.3.0 (top level)
├── jquery@1.11.10 (top level)
├── less@2.7.11 (top level)
├── reactive-var@1.0.11 (expanded above)
├── standard-minifiers@1.1.0 (top level)
├── templating@1.3.2 (expanded above)
└── underscore@1.0.10
ethereum:web3@0.20.2
fastclick@1.0.13
frozeman:animation-helper@0.2.6
├── jquery@1.11.10 (top level)
├── templating@1.3.2 (expanded above)
└── underscore@1.0.10
frozeman:global-notifications@0.2.1
├── frozeman:animation-helper@0.2.6 (top level)
├── less@2.7.11 (top level)
├── random@1.0.10 (top level)
├── reactive-var@1.0.11 (expanded above)
├── templating@1.3.2 (expanded above)
└── underscore@1.0.10
frozeman:inline-form@0.1.0
├── frozeman:animation-helper@0.2.6 (top level)
├─┬ frozeman:simple-modal@0.0.7
│ ├── frozeman:animation-helper@0.2.6 (top level)
│ ├── jquery@1.11.10 (top level)
│ ├── session@1.1.7 (top level)
│ └── templating@1.3.2 (expanded above)
├── frozeman:template-var@1.3.0 (top level)
├── jquery@1.11.10 (top level)
├── less@2.7.11 (top level)
└── templating@1.3.2 (expanded above)
frozeman:persistent-minimongo2@0.3.5
└── underscore@1.0.10
frozeman:reactive-timer@0.1.7
├── tracker@1.1.3
└── underscore@1.0.10
frozeman:storage@0.1.9
├── ejson@1.1.0 (top level)
├─┬ localstorage@1.2.0
│ └── random@1.0.10 (top level)
└── underscore@1.0.10
frozeman:template-var@1.3.0
├── reactive-var@1.0.11 (expanded above)
├── templating@1.3.2 (expanded above)
└── underscore@1.0.10
haloplatform:accounts@0.4.0
├── ethereum:web3@0.20.2
├── frozeman:persistent-minimongo@0.1.8 (expanded above)
├── mongo@1.3.1 (top level)
└── underscore@1.0.10
hashanp:geopattern@0.0.1
http@1.3.0
├── ecmascript@0.9.0 (expanded above)
├── underscore@1.0.10
└─┬ url@1.1.0
  └── underscore@1.0.10
jeeeyul:moment-with-langs@2.12.1
└── underscore@1.0.10
jquery@1.11.10
└── modules@0.11.2 (expanded above)
jrudio:bluebird@3.3.1_1
kadira:blaze-layout@2.3.0
├── blaze@2.3.2 (expanded above)
├── jquery@1.11.10 (top level)
├── reactive-dict@1.2.0 (expanded above)
├── templating@1.3.2 (expanded above)
├── tracker@1.1.3
└── underscore@1.0.10
kadira:flow-router@2.12.1
├── ejson@1.1.0 (top level)
├── modules@0.11.2 (expanded above)
├── reactive-dict@1.2.0 (expanded above)
├── reactive-var@1.0.11 (expanded above)
├── tracker@1.1.3
└── underscore@1.0.10
less@2.7.11
├── caching-compiler@1.1.9 (expanded above)
├── ecmascript@0.9.0 (expanded above)
└── underscore@1.0.10
logging@1.1.19
├── ejson@1.1.0 (top level)
├── modules@0.11.2 (expanded above)
└── underscore@1.0.10
markdown@1.0.12
meteor-base@1.2.0
├── ddp@1.4.0 (expanded above)
├── dynamic-import@0.2.1 (top level)
├─┬ hot-code-push@1.0.4
│ ├─┬ autoupdate@1.3.12
│ │ ├── check@1.2.5 (top level)
│ │ ├── ddp@1.4.0 (expanded above)
│ │ ├── http@1.3.0 (top level)
│ │ ├── mongo@1.3.1 (top level)
│ │ ├── random@1.0.10 (top level)
│ │ ├── retry@1.0.9 (expanded above)
│ │ ├── tracker@1.1.3
│ │ ├── underscore@1.0.10
│ │ └── webapp@1.4.0 (expanded above)
│ └── reload@1.1.11 (top level)
├─┬ livedata@1.0.18
│ └── ddp@1.4.0 (expanded above)
├── underscore@1.0.10
└── webapp@1.4.0 (expanded above)
mobile-experience@1.0.5
├── launch-screen@1.1.1
└── mobile-status-bar@1.0.14
mongo@1.3.1
├─┬ allow-deny@1.1.0
│ ├── check@1.2.5 (top level)
│ ├── ddp@1.4.0 (expanded above)
│ ├── ecmascript@0.9.0 (expanded above)
│ ├── ejson@1.1.0 (top level)
│ └── minimongo@1.4.3 (expanded above)
├─┬ binary-heap@1.0.10
│ ├── id-map@1.0.9 (expanded above)
│ └── underscore@1.0.10
├── callback-hook@1.0.10 (expanded above)
├── check@1.2.5 (top level)
├── ddp@1.4.0 (expanded above)
├── diff-sequence@1.0.7 (expanded above)
├── ecmascript@0.9.0 (expanded above)
├── ejson@1.1.0 (top level)
├── minimongo@1.4.3 (expanded above)
├─┬ mongo-dev-server@1.1.0
│ └── modules@0.11.2 (expanded above)
├── mongo-id@1.0.6 (expanded above)
├── npm-mongo@2.2.33
├── random@1.0.10 (top level)
├── tracker@1.1.3
└── underscore@1.0.10
mrt:qrcodesvg@0.1.0
numeral:languages@1.5.3
└── numeral:numeral@1.5.3_1
numeral:numeral@1.5.3_1
raix:handlebar-helpers@0.2.5
├── deps@1.0.12 (expanded above)
├── session@1.1.7 (top level)
├── ui@1.0.13 (expanded above)
└── underscore@1.0.10
random@1.0.10
├── ecmascript@0.9.0 (expanded above)
└── underscore@1.0.10
reload@1.1.11
├── ecmascript-runtime@0.5.0 (expanded above)
└── underscore@1.0.10
sacha:spin@2.3.1
├── templating@1.3.2 (expanded above)
└── underscore@1.0.10
session@1.1.7
├── ejson@1.1.0 (top level)
├── reactive-dict@1.2.0 (expanded above)
└── underscore@1.0.10
shell-server@0.3.1
└── ecmascript@0.9.0 (expanded above)
spacebars@1.0.15
├── blaze@2.3.2 (expanded above)
├── htmljs@1.0.11 (expanded above)
├── observe-sequence@1.0.16 (expanded above)
├── tracker@1.1.3
└── underscore@1.0.10
standard-minifiers@1.1.0
├─┬ standard-minifier-css@1.3.5
│ └─┬ minifier-css@1.2.16
│   └── underscore@1.0.10
└─┬ standard-minifier-js@2.2.3
  ├── babel-compiler@6.24.7 (expanded above)
  ├── ecmascript@0.9.0 (expanded above)
  └─┬ minifier-js@2.2.2
    └── babel-compiler@6.24.7 (expanded above)
tap:i18n@1.8.2
├─┬ aldeed:simple-schema@1.3.3
│ ├── check@1.2.5 (top level)
│ ├── deps@1.0.12 (expanded above)
│ ├── random@1.0.10 (top level)
│ └── underscore@1.0.10
├─┬ cfs:http-methods@0.0.32
│ ├── ejson@1.1.0 (top level)
│ ├── underscore@1.0.10
│ └── webapp@1.4.0 (expanded above)
├── check@1.2.5 (top level)
├── coffeescript@1.0.17 (expanded above)
├── jquery@1.11.10 (top level)
├── meteorspark:util@0.2.0
├─┬ raix:eventemitter@0.1.3
│ └── underscore@1.0.10
├── session@1.1.7 (top level)
├── templating@1.3.2 (expanded above)
├── tracker@1.1.3
└── underscore@1.0.10
tap:i18n-bundler@0.3.0
├── coffeescript@1.0.17 (expanded above)
├── jquery@1.11.10 (top level)
└── tap:i18n@1.8.2 (top level)
```