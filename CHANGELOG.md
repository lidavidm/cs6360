<a name="alpha"></a>
## alpha (2016-03-17)


#### Features

*   execute user-supplied code in Python ([4790d0bd](https://github.com/lidavidm/cs6360/commit/4790d0bdc25aed2567763dab553600a899709d37))
*   make sidebar use space better in execution mode ([f13d0789](https://github.com/lidavidm/cs6360/commit/f13d0789c4fec131ceebcac4b10eee12a8e3fa82))
*   make sidebar more responsive ([ea24b6e0](https://github.com/lidavidm/cs6360/commit/ea24b6e000f3619c25f476562482979a29f43a46))
*   add basic tooltips ([18b0086b](https://github.com/lidavidm/cs6360/commit/18b0086baa7ca8c3faba0b066228d2d0250f01a1))
*   improve overall page styling ([f56afe09](https://github.com/lidavidm/cs6360/commit/f56afe09d9e82d7e19200063460b70cebe5bd12a))
*   render basic robot sprite ([4828e12f](https://github.com/lidavidm/cs6360/commit/4828e12fa546ad2b3bc80eecab68559156759ef6))
*   add assets submodule ([9f75863e](https://github.com/lidavidm/cs6360/commit/9f75863e8da7c3f4ce1233a16f06f097384bb07d))
* **Block Editor:**
  *  add hints for tell block ([a9bfc307](https://github.com/lidavidm/cs6360/commit/a9bfc3073b574b202f7205706ab5e73688f28ef4))
  *  highlight blocks as they are executed ([fa3ff017](https://github.com/lidavidm/cs6360/commit/fa3ff0172486a86466850f7abe7a09f5da9c8cfc))
  *  add hint for method block ([6d24338e](https://github.com/lidavidm/cs6360/commit/6d24338ed0dbab63cebdd64627836eee07180e4e))
  *  pull methods from class definition ([5b4f0efb](https://github.com/lidavidm/cs6360/commit/5b4f0efbcfeb11c97f6606430d06d9ba04697675))
  *  add Robot class definition at runtime ([397d7a79](https://github.com/lidavidm/cs6360/commit/397d7a7983036a9405fdb8eed5fa4f7fc0215f42))
  *  update class image of object block on change ([394c0405](https://github.com/lidavidm/cs6360/commit/394c040585ddb755d18ebdfd7788e5c2ba61ddcb))
  *  check method against object type ([61b87c5f](https://github.com/lidavidm/cs6360/commit/61b87c5f6bbb822e7cf8defca87e0f00cd854636))
  *  define methods, categories at runtime ([e4d5759d](https://github.com/lidavidm/cs6360/commit/e4d5759d188329cc3a2783441dd6decacb0f06c7))
  *  show class in variable block ([3ab504ac](https://github.com/lidavidm/cs6360/commit/3ab504acc73273186bf7d516f0272fb693df9b4c))
  *  check types strongly when connecting methods ([ef6c1b56](https://github.com/lidavidm/cs6360/commit/ef6c1b568c53262ef8116319281ba8eaa6c59688))
  *  add basic Python codegen ([7bc9a643](https://github.com/lidavidm/cs6360/commit/7bc9a643139d34d24b421439fa8db9ebd1aff02b))
  *  disable editing when running ([e70bd8ca](https://github.com/lidavidm/cs6360/commit/e70bd8ca7f917c0c4b9623ccd4dd84e04b39348f))
  *  add blueprint background to toolbox ([41f9bcd5](https://github.com/lidavidm/cs6360/commit/41f9bcd50e707d63549fd738d6714db7cd1aa4e2))
  *  style blueprint in toolbox better ([18f6e538](https://github.com/lidavidm/cs6360/commit/18f6e538ca14ac2e368110f3b6debd032ab77b80))
* **Level:**
  *  implement level switching ([b2309dd2](https://github.com/lidavidm/cs6360/commit/b2309dd23080e47514d707f84d062792f160395e))
  *  check off objectives as they are completed ([cb019ee3](https://github.com/lidavidm/cs6360/commit/cb019ee390c874ff30e70d605ea8a074d1adffbf))
  *  integrate with model ([2ad2d990](https://github.com/lidavidm/cs6360/commit/2ad2d990cde1ffda23cc11fd8e3815d4acee8f7d))
  *  add basic Level class ([7fd71c45](https://github.com/lidavidm/cs6360/commit/7fd71c454208e67076980feccf79e48ed4108c11))
* **Level,Objectives:**
  *  animate congratulations dialog ([a0d91846](https://github.com/lidavidm/cs6360/commit/a0d918461afa95cec3ef9114e88c0daf8175f3a2))
  *  show victory screen on level 'completed' ([a44f7bc8](https://github.com/lidavidm/cs6360/commit/a44f7bc8e569e638ed80784ea238b2265ecaf1ee))
  *  move objectives into level model ([c4ab312a](https://github.com/lidavidm/cs6360/commit/c4ab312a3a11a362d291bddfc5e4ecfa06e5d268))
* **Map:**
  *  render grid ([6b970c71](https://github.com/lidavidm/cs6360/commit/6b970c71078b7252fbca1dddb77f6fe67ce9435e), closes [#27](https://github.com/lidavidm/cs6360/issues/27))
  *  always render zoomed in ([f55c43e5](https://github.com/lidavidm/cs6360/commit/f55c43e5a94696579f3f1ba30d6add5ec9ce5f9d), closes [#19](https://github.com/lidavidm/cs6360/issues/19))
  *  add reset button after execution ([b60329f4](https://github.com/lidavidm/cs6360/commit/b60329f4926722b13860979b08537b210d60e636))
  *  render iron on map ([dc168001](https://github.com/lidavidm/cs6360/commit/dc168001eac2e940a60b7249063c4047307acc8f))
  *  make overall design responsive ([ce461962](https://github.com/lidavidm/cs6360/commit/ce4619628b98ea9d77283a087ee256b7186a8740))
  *  make map scrolling work when zoomed ([7f8631d1](https://github.com/lidavidm/cs6360/commit/7f8631d101ddc68c6c8452fb6b9bd2746e95fe7e))
* **Model:**
  *  properly reset world after execution ([11508c84](https://github.com/lidavidm/cs6360/commit/11508c84731efaf88c36a94ae457d5ee007adeaa))
  *  uncouple animation and model updates ([abb1c6e7](https://github.com/lidavidm/cs6360/commit/abb1c6e74d27bed0faa4726ec31313d85edf3cca))
  *  don't allow moves onto impassable tiles ([0bafea6c](https://github.com/lidavidm/cs6360/commit/0bafea6c00852616f40c6470c589d6b35be914d9))
  *  get robots by IDs ([8a13f10a](https://github.com/lidavidm/cs6360/commit/8a13f10ad51311dab823c3c2cf64edb6663f6649))
  *  integrate Robot's pickup functionality with Phaser ([e98f84bd](https://github.com/lidavidm/cs6360/commit/e98f84bdce7e20c4874b5fef6fd54176d9aee14a))
  *  implement moveForward on Robot ([a0150e01](https://github.com/lidavidm/cs6360/commit/a0150e015f9eb8bf3b78dab9f8c87e972c57ec54))
  *  more range checking ([7d567abd](https://github.com/lidavidm/cs6360/commit/7d567abda26a5a0feaec9d74bba48738bf0a8df8))
  *  rudimentary pickupUnderneath ([9e94f693](https://github.com/lidavidm/cs6360/commit/9e94f693b1c6859f7c64c60fee8d67b30ac09dfa))
  *  robot movement ([de59ad6d](https://github.com/lidavidm/cs6360/commit/de59ad6dad125ed84a8fcfed9d7219852ffda2e5))
  *  add bounds checking to World ([ae3f5963](https://github.com/lidavidm/cs6360/commit/ae3f5963c6a66c7b2b6657f72d0acaa06208d42e))
  *  add Robot to model ([d18e31dc](https://github.com/lidavidm/cs6360/commit/d18e31dcf6c093b28159437bfd77e78df6d8ad35))
* **Objectives:**
  *  add some more animations ([21cddda2](https://github.com/lidavidm/cs6360/commit/21cddda24bed77d566eb5f3707feb5cb958fd98d))
  *  add checkbox to objectives ([e3d09a97](https://github.com/lidavidm/cs6360/commit/e3d09a9799f4836aff0f839747fc293f83f12e7e))
* **PubSub:**  add pubsub helper ([7b5eff04](https://github.com/lidavidm/cs6360/commit/7b5eff044dedaf6eeb5ab4f45dea185d9a0e5374))
* **Python Codegen:**
  *  insert 'block end' call after each statement ([5a83ac1c](https://github.com/lidavidm/cs6360/commit/5a83ac1cd37af82a3391bf657341682bad8586d7))
  *  don't set free variables to None ([1ba12800](https://github.com/lidavidm/cs6360/commit/1ba12800006218c60c22a9f79a14bc813130aa1c))
* **Python Interpreter:**
  *  show error to user ([de8c42af](https://github.com/lidavidm/cs6360/commit/de8c42af7bd48513982b3524b71fa58768224500))
  *  use proxy class for JS classes ([e5ba1cbd](https://github.com/lidavidm/cs6360/commit/e5ba1cbd27fc24e69412fc2414a6db0c1b50f35f))
  *  now using Skulpt for python interpretation ([6d625538](https://github.com/lidavidm/cs6360/commit/6d62553832d6285b08f9414bf0367534cb07e360))
  *  work around lack of __main__ for bdb ([ff4016ed](https://github.com/lidavidm/cs6360/commit/ff4016ed4f6a09605f77238ba2698bd487497edc))
* **Tooltips:**  add × to dismiss tooltip ([959383d5](https://github.com/lidavidm/cs6360/commit/959383d5088e1889bb68c547015c26e773c1b269))

#### Bug Fixes

*   only check objectives as needed ([ef81af6e](https://github.com/lidavidm/cs6360/commit/ef81af6e21e5f65d2241094dca7a7e214949da99))
*   make sure .gitmodules points to our custom repos ([053015a1](https://github.com/lidavidm/cs6360/commit/053015a15a12c1b9d7e773422c5925ae8402ff60))
* **Block Editor:**
  *  generate correct code for methods ([0f38140c](https://github.com/lidavidm/cs6360/commit/0f38140cbfb55ed33ba7fd48ae78c1cab0c96719))
  *  check types on block mutate, not just block move ([e0a871bf](https://github.com/lidavidm/cs6360/commit/e0a871bfd00d58094308f43c0c8f0e8bfd7d6333))
* **Map:**  scroll properly when zoomed ([e7d0d5a9](https://github.com/lidavidm/cs6360/commit/e7d0d5a953d006c5680bf255bf2b19b036b52a95))
* **Model:**
  *  switch to !== ([9798fb6d](https://github.com/lidavidm/cs6360/commit/9798fb6d585c68f74860eb4898c8360c44395cb0))
  *  make pick up effect more visible ([8b456a5f](https://github.com/lidavidm/cs6360/commit/8b456a5f35071ed63afbfc480d0b882341c6fb3d))
  *  auto-add objects to world, fix pick up ([0e7d22fa](https://github.com/lidavidm/cs6360/commit/0e7d22fadefd0a5d32fe84b934c7287beadd5857))
  *  change pick up tween to use alpha instead of visible ([cf64462c](https://github.com/lidavidm/cs6360/commit/cf64462c3281f475ac7b10f60ca4e0537d7097b0))
  *  ability to get robot's inventory ([fbd84099](https://github.com/lidavidm/cs6360/commit/fbd8409951af6eba09c787335c6245e2c79b6db8))
  *  make direction handling match Phaser ([1e446e10](https://github.com/lidavidm/cs6360/commit/1e446e108c32f6d22116560ffbe3d2759374c64e))
  *  update signature of method decorator ([52993aff](https://github.com/lidavidm/cs6360/commit/52993aff35ee2fc0968b94d5ad2ccb670c2c5d9d))
* **Python Codegen:**
  *  fix typechecking, codegen of partial blocks ([6a40914c](https://github.com/lidavidm/cs6360/commit/6a40914ce2bb6d76618b704f24c89f86a3e34b3a), closes [#23](https://github.com/lidavidm/cs6360/issues/23))
  *  add statement postfix correctly ([77158d34](https://github.com/lidavidm/cs6360/commit/77158d343f1308ac45d1444d82479a0d3e2a2c98))
* **Python Interpreter:**  return promise so others can wait for it ([a87da56c](https://github.com/lidavidm/cs6360/commit/a87da56c1baac2a9b04704c829bbd6c03fc3e47a))



