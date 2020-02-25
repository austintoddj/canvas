# Release Notes

## [Unreleased](https://github.com/cnvs/canvas/compare/master...develop)

## [5.2.5](https://github.com/cnvs/canvas/compare/v5.2.4...v5.2.5) (February 24, 2020)

### Fixed
- Fix for a bad array offset when using PHP 7.4 ([#635](https://github.com/cnvs/canvas/issues/635))
- Fixed zero-decimals with an optional parameter ([33d1692](https://github.com/cnvs/canvas/commit/33d16924beb425b6157a9ec65d7fe7ee5a21d2d2))

### Changed
- Refactored the `canvas:setup` Artisan command ([0dfb717](https://github.com/cnvs/canvas/commit/0dfb717a832590bc1c133a9fb6f611fdbaf172b0))

## [5.2.4](https://github.com/cnvs/canvas/compare/v5.2.3...v5.2.4) (February 10, 2020)

### Fixed
- Fix for the incorrect middleware on the route stub ([#625](https://github.com/cnvs/canvas/issues/625))

## [5.2.3](https://github.com/cnvs/canvas/compare/v5.2.2...v5.2.3) (February 9, 2020)

### Fixed
- Fixed broken editor/embed links ([#624](https://github.com/cnvs/canvas/issues/624))

## [5.2.2](https://github.com/cnvs/canvas/compare/v5.2.1...v5.2.2) (February 9, 2020)

### Fixed
- Fixed a Safari-related bug ([e42ce62](https://github.com/cnvs/canvas/commit/e42ce624a2b2827332384a86089fa956fb6a6f4c))

## [5.2.1](https://github.com/cnvs/canvas/compare/v5.2.0...v5.2.1) (February 9, 2020)

### Fixed
- Fixed a bug on referer attributes ([9631885](https://github.com/cnvs/canvas/commit/9631885e1d1cb8330556172d4fc4132d73d38459))

## [5.2.0](https://github.com/cnvs/canvas/compare/v5.1.1...v5.2.0) (February 9, 2020)

### Fixed
- Fixed the translations based on locale ([#595](https://github.com/cnvs/canvas/issues/595), [01ec767](https://github.com/cnvs/canvas/commit/01ec767e9cdc9faedc7395f517aa2898d1342385))
- Fixed a parse error for canonical URLs ([#610](https://github.com/cnvs/canvas/issues/610), [f706204](https://github.com/cnvs/canvas/commit/f706204d21414d10277360900519e69de80b9236))

### Changed
- Removed the `og_*` and `twitter_*` tags from SEO meta
- Cleanup and refactor of all language files
- Comprehensive refactor of the image/featured image modals to utilize [FilePond](https://pqina.nl/filepond) and [vue-infinite-loading](https://peachscript.github.io/vue-infinite-loading)
- Updated the modal animations ([66bb4ac](https://github.com/cnvs/canvas/commit/66bb4ac83bffb33346cc6cc127a062b01da9c5c2))
- UI/UX improvements

### Added
- Added support for Visitor tracking
- Added a mini Publish button for mobile devices ([c0f73e9](https://github.com/cnvs/canvas/commit/c0f73e9dd2e62951aaa29316fe1d3586b1bbac35))
- Added infinite loading to Unsplash image searches
- Enhancements to link/video embedding in the editor

## [5.1.1](https://github.com/cnvs/canvas/compare/v5.0.0...v5.1.1) (January 22, 2020)

## Fixed
- Updated the views table migration to support MariaDB ([#607](https://github.com/cnvs/canvas/issues/607), [9a27a1f](https://github.com/cnvs/canvas/commit/9a27a1f86141d5bcc25c6cd3751e6fd499b56654))

## [5.1.0](https://github.com/cnvs/canvas/compare/v5.0.3...v5.1.0) (January 22, 2020)

## Changed
- Changed the chart library from Frappe Charts to Charts.js ([0a5607b](https://github.com/cnvs/canvas/commit/0a5607b040874391d0cc34dfec70e320783db2f6))
- Refactored the mailable to a markdown template ([cefbd93](https://github.com/cnvs/canvas/commit/cefbd93290a33d382861e311d3c42a8d52a29c6e))

## Added
- Added infinite loading ([e34f7f4](https://github.com/cnvs/canvas/commit/e34f7f47093bf42e19c9a2b376db47c337ad4bfc), [415c9ec](https://github.com/cnvs/canvas/commit/415c9ec2994f9c67a1273bb15994c5af0bb28ca1), [686b85c](https://github.com/cnvs/canvas/commit/686b85ce5f41bdb3e4f62520666f68dcada88c58))
- Added user-managed settings ([8466aa0](https://github.com/cnvs/canvas/commit/8466aa02006cc68a0c5d06c6d54a2e896654abdc))
- Added an editor control bar for mobile devices ([d48b72d](https://github.com/cnvs/canvas/commit/d48b72db213d902ce54dabafc3e74da8e62fc95c))
- Added translations for Turkish and Dutch ([201aeb4](https://github.com/cnvs/canvas/commit/201aeb4d439b1438636accb1411c6db762fc6e9e), [281e604](https://github.com/cnvs/canvas/commit/281e604edcda0a717ee73fa8a095f8a2628a60f7))

## [5.0.3](https://github.com/cnvs/canvas/compare/v5.0.2...v5.0.3) (December 16, 2019)

## Fixed
- Added an existence check in the default template ([0ea4bf7](https://github.com/cnvs/canvas/pull/582/commits/0ea4bf7859da54967410751b3b39807fba16ca3c))

## [5.0.2](https://github.com/cnvs/canvas/compare/v5.0.1...v5.0.2) (December 13, 2019)

## Fixed
- Fixed a non-object error on the default template ([fc65d52](https://github.com/cnvs/canvas/commit/fc65d520e722bb44cf376be698823fa5f92c236e))

## [5.0.1](https://github.com/cnvs/canvas/compare/v5.0.0...v5.0.1) (December 7, 2019)

## Fixed
- Addressed 3rd party security vulnerabilities ([8403b92](https://github.com/cnvs/canvas/commit/8403b924708c36fbb3d8ed1e307e2b802790bfab))

## [5.0.0](https://github.com/cnvs/canvas/compare/v4.2.9...v5.0.0) (December 5, 2019)

## Changed
- Complete re-write of the package into a single page application
- Replaced the FontAwesome library with custom illustrated icons from [RefactoringUI](https://refactoringui.com)
- Comprehensive update to the color palette
- Updated the digest notifications config variable ([02055d1](https://github.com/cnvs/canvas/commit/02055d1291fce1cd5434a1a6551e2e24f13fe185))

## Added
- Added Vuex for state management ([de90dd8](https://github.com/cnvs/canvas/commit/de90dd8e512f223a0c59b39556c8a92667d70854))
- Added [NProgress](https://github.com/rstacruz/nprogress) on page loads
- Added an autosaving feature to the editor
- Added SEO data syncing ([#506](https://github.com/cnvs/canvas/issues/506))

## Fixed
- Updated version support in CI testing ([#513](https://github.com/cnvs/canvas/issues/513), [f702d8d](https://github.com/cnvs/canvas/commit/f702d8d2c5c5bad8512ae0458794d91fbcb338c8))
- Restricted access to content viewing/editing based on authorship [d9e25f4](https://github.com/cnvs/canvas/commit/d9e25f4df94e3302ee57d3b3617fda30cf5440a0)

## [4.2.9](https://github.com/cnvs/canvas/compare/v4.2.8...v4.2.9) (September 20, 2019)

## Fixed
- Patch for null referer URLs being passed in the view listener ([76e5fd6](https://github.com/cnvs/canvas/commit/76e5fd6aca480cda2455a195001babecf9e76b37))

## [4.2.8](https://github.com/cnvs/canvas/compare/v4.2.7...v4.2.8) (September 17, 2019)

## Added
- Added support for Laravel 6 LTS ([#549](https://github.com/cnvs/canvas/issues/549), [cd5fab3](https://github.com/cnvs/canvas/commit/cd5fab3b1ea1544e5256abd868fd09f88e8cff5a))

## Fixed
- Patch for an undefined 'host' index on referer links ([#545](https://github.com/cnvs/canvas/issues/545), [#546](https://github.com/cnvs/canvas/pull/546), [dfa09e3](https://github.com/cnvs/canvas/commit/dfa09e314a4ca45864dd96cd3353609a87d8ef2f))

## [4.2.7](https://github.com/cnvs/canvas/compare/v4.2.6...v4.2.7) (August 19, 2019)

## Added
- Added an Open Graph prefix and `og-type` ([#521](https://github.com/cnvs/canvas/pull/521), [1a81dd8](https://github.com/cnvs/canvas/commit/1a81dd81d615b1dc47385126c686abebc7d9c69f))

## Fixed
- Patch for the missing info line output during the `canvas:setup` command ([8e3751e](https://github.com/cnvs/canvas/commit/8e3751e96ff7daa285c206df86b471c3a613661a))
- Patch for the referer property being null but not empty ([#533](https://github.com/cnvs/canvas/issues/533), [6b92b5e](https://github.com/cnvs/canvas/commit/6b92b5ec843f57f3788ebb4720a87e88c191ea7a))

## [4.2.6](https://github.com/cnvs/canvas/compare/v4.2.5...v4.2.6) (June 19, 2019)

## Changed
- Upgraded to Font Awesome 5.9 ([26cacf2](https://github.com/cnvs/canvas/commit/26cacf2ae09a6938614630a6420d92369e73b012))

## Fixed
- Patch for PHP 7.0 constants not supporting visibility and CarbonPeriod not being available in Laravel LTS ([#511](https://github.com/cnvs/canvas/issues/511), [6e49604](https://github.com/cnvs/canvas/commit/6e49604fca9ea5dd8e5ccfae09a0ea32df326138))

## [4.2.5](https://github.com/cnvs/canvas/compare/v4.2.4...v4.2.5) (June 15, 2019)

## Changed
- Minor refactor of the digest email ([543398a](https://github.com/cnvs/canvas/commit/543398a3a881608b9012d9e541faafd1fef9d512))

## Added
- Added support for Laravel LTS(5.5) ([#511](https://github.com/cnvs/canvas/issues/511), [acdf9ed](https://github.com/cnvs/canvas/commit/acdf9ed80723589610031f606bf869831aecdb9d))

## Fixed
- Patch for the default controller not being built on an initial setup ([e1d8625](https://github.com/cnvs/canvas/commit/e1d8625ec04037f9ef5324e422ac5702048160a0))

## [4.2.4](https://github.com/cnvs/canvas/compare/v4.2.3...v4.2.4) (June 12, 2019)

## Fixed
- Patch for the canonical link causing an undefined index ([#508](https://github.com/cnvs/canvas/issues/508), [3a45bc7](https://github.com/cnvs/canvas/commit/3a45bc7136728bfddeed945b2ac1e2dff5bca7a2))

## [4.2.3](https://github.com/cnvs/canvas/compare/v4.2.2...v4.2.3) (June 10, 2019)

## Changed
- Refactored the `pt` language files to `pt-BR` ([#500](https://github.com/cnvs/canvas/issues/500), [865b392](https://github.com/cnvs/canvas/commit/865b392e9205bba15bc7d24ec4045743a62a574f))

## Added
- Added canonical link support to improve SEO ([#498](https://github.com/cnvs/canvas/pull/498))
- Added multilingual support for Hindi ([047c299](https://github.com/cnvs/canvas/commit/047c299b37228a8690de802f446a8c342a795f5b))
- Added a `--data` option for the setup command that will seed demo content ([#494](https://github.com/cnvs/canvas/issues/494), [009a5fb](https://github.com/cnvs/canvas/commit/009a5fb8dbc59876c532d5f1157ae66c347b8b2c))

## Fixed
- Patch for the default template to utilize the correct meta tags ([#496](https://github.com/cnvs/canvas/issues/496), [acff60c](https://github.com/cnvs/canvas/commit/acff60c546d77766de62b583e90f07855b0c54aa))
- Removed a bad method call in the post list component ([0f373ae](https://github.com/cnvs/canvas/commit/0f373aed96e9cdce57a5174f940cef175fd3e4eb))

## [4.2.2](https://github.com/cnvs/canvas/compare/v4.2.1...v4.2.2) (June 1, 2019)

## Changed
- Updated the German translations ([89e5f76](https://github.com/cnvs/canvas/commit/89e5f76f8f53c4337fd468e5b8e2b78830a25281), [c77fa7a](https://github.com/cnvs/canvas/commit/c77fa7ad9c84a85fc777fe985d99ccef99528de2))
- Updated the Spanish translations ([#495](https://github.com/cnvs/canvas/pull/495), [f7ab6c2](https://github.com/cnvs/canvas/commit/f7ab6c2bb2f911131442eba80d100f9822e2ccef), [54ecb39](https://github.com/cnvs/canvas/commit/54ecb39b99e77efb71e11be01f3401de70a8639a))
- Minor updates from PHP Insights ([7a297c2](https://github.com/cnvs/canvas/commit/7a297c284f5fc68f9cda9b8a208d3b184db9d010))
- Refactored the command output lines ([7466c19](https://github.com/cnvs/canvas/commit/7466c19ed2bd7b65852e007140fc2d0ecd5b4bf0))
- Reverted the font display options ([b9326c1](https://github.com/cnvs/canvas/commit/b9326c1f36882e06c24673b13bcb485062126726))

## Fixed
- Bumped Axios version to patch a security vulnerability ([4a2140f](https://github.com/cnvs/canvas/commit/4a2140f723e987c9408d091650a54f5225319357))

## [4.2.1](https://github.com/cnvs/canvas/compare/v4.2.0...v4.2.1) (May 29, 2019)

## Changed
- Refactored the command output lines ([94ddef1](https://github.com/cnvs/canvas/commit/94ddef17704843b9efdff50f27669dcbe116b3b5))
- Improved font load times with the display swap property ([43c448a](https://github.com/cnvs/canvas/commit/43c448ab7155dcda2f5643cfb66d0350eab0dccb))

## Fixed
- Fixed the missing featured image property on the posts index ([15c559b](https://github.com/cnvs/canvas/commit/15c559b25e440460ba97e2de7708d72a8ff2fd4d))
- Fixed incorrect line widths being applied to the line chart components ([046211e](https://github.com/cnvs/canvas/commit/046211e3e1fa2f3a9099259c5e74f10dc9980d8a))

## [4.2.0](https://github.com/cnvs/canvas/compare/v4.1.39...v4.2.0) (May 25, 2019)

## Changed
- Query optimization ([2afc167](https://github.com/cnvs/canvas/commit/2afc1676cb053e2f13a450308a69f4ad367162c5))

## Added
- Added multilingual support for Spanish, German and Arabic ([231494f](https://github.com/cnvs/canvas/commit/231494fe3310137c69b9b7217d8ee15fd613dbb9), [3aa2296](https://github.com/cnvs/canvas/commit/3aa229643baec844608f7c4c23db77efb28c9ef3), [02f704c](https://github.com/cnvs/canvas/commit/02f704c5a4d9e3df80ba8e83964f189c60748353))

## Fixed
- Fixed an inconsistency with post objects prior to passing to the `PostList` component ([5aa89ff](https://github.com/cnvs/canvas/commit/5aa89ff007b4a7d45e40ffcaad534de813b50f58))
- Fixed an incorrect total posts count on the stats index ([616d4b8](https://github.com/cnvs/canvas/commit/616d4b8257be3c3c8f123fd1ae07644c35f864bd))
- Fixed the incorrect translation line being pulled on the stats index ([ba66fa8](https://github.com/cnvs/canvas/commit/ba66fa88106f5a6cc791ae0f59a46e1a039e2d69))
- Fixed missing validation lines from the language files ([b33389e](https://github.com/cnvs/canvas/commit/b33389ed0df09a51875913b34d26edd8b1097f73))
- Fixed the styling on the default template navbar ([e8a67f8](https://github.com/cnvs/canvas/commit/e8a67f8a8374c9e29776a3f0995b679ca0a14b89))

## [v4.1.39](https://github.com/cnvs/canvas/compare/v4.1.38...v4.1.39) (May 22, 2019)

### Fixed
- Fixed Moment.js not respecting the app timezone ([#474](https://github.com/cnvs/canvas/issues/474), [#482](https://github.com/cnvs/canvas/pull/482), [a9c64d9](https://github.com/cnvs/canvas/commit/a9c64d965e4acad7f0e65432118cef9cd82f44a8))

## [v4.1.38](https://github.com/cnvs/canvas/compare/v4.1.37...v4.1.38) (May 21, 2019)

### Changed
- Refactored `PostTags` to `PostsTags` ([f091d32](https://github.com/cnvs/canvas/commit/f091d322430c27b2b29c8356bc68cde532b1eff1))

### Added
- Added support for a weekly digest e-mail ([7d385bd](https://github.com/cnvs/canvas/commit/7d385bd9da3a4a37ded04373c67203f35f531f19))
- Added multilingual support for Russian ([418ad29](https://github.com/cnvs/canvas/commit/418ad290637cef92a8d561c0471af28f468c8e7b))

## [v4.1.37](https://github.com/cnvs/canvas/compare/v4.1.36...v4.1.37) (May 16, 2019)

### Changed
- Minor updates to the sponsorship page ([91a6ff5](https://github.com/cnvs/canvas/commit/91a6ff598821fe76627398be6b725c2ad3cb522c))

## [v4.1.36](https://github.com/cnvs/canvas/compare/v4.1.35...v4.1.36) (May 16, 2019)

### Added
- Added sponsor information ([6476549](https://github.com/cnvs/canvas/commit/64765492e228ac859399054f7aee05e5fcf07b33))

## [v4.1.35](https://github.com/cnvs/canvas/compare/v4.1.34...v4.1.35) (May 13, 2019)

### Changed
- Refactored list components and updated prop definitions ([092a0cb](https://github.com/cnvs/canvas/commit/092a0cb085111ef307b3f74302182f4e684a374c), [11f43c0](https://github.com/cnvs/canvas/commit/11f43c0cb07c3162077bcb28a7bf81ee35bf0ae1))

## [v4.1.34](https://github.com/cnvs/canvas/compare/v4.1.33...v4.1.34) (May 10, 2019)

### Changed
- Refactored Vue components to better align with the official style guide ([6c27729](https://github.com/cnvs/canvas/commit/6c2772926320e25a7f550d7da427772526465df2), [4fbc257](https://github.com/cnvs/canvas/commit/4fbc257c249538d6c7b52ddbf04af08b6d2735b1))

## [v4.1.33](https://github.com/cnvs/canvas/compare/v4.1.32...v4.1.33) (May 2, 2019)

### Changed
- Refactored the blade templates [2d37762](https://github.com/cnvs/canvas/commit/2d377623bbf103d593b326008e898e8f969a31a4)
- Updated the default template dependencies [8136282](https://github.com/cnvs/canvas/commit/8136282391830d73c38afc12c487e37f10a2a7ca)

## [v4.1.32](https://github.com/cnvs/canvas/compare/v4.1.31...v4.1.32) (April 29, 2019)

### Changed
- Updated the French translations ([#466](https://github.com/cnvs/canvas/commit/7ff9a356d5cccac6dee735a4915e81b89482c71f), [#467](https://github.com/cnvs/canvas/commit/f7c1ed69d1058d1d608757b2e0eb936e8e941cb5), [#468](https://github.com/cnvs/canvas/commit/ff5d2b7b5c45f5b86dd816694bba0fe74e8337d4), [#469](https://github.com/cnvs/canvas/commit/9e46ab3f1683ff587a77be19a2f5c3b871aff57e), [#470](https://github.com/cnvs/canvas/commit/c25df9f1336cf3bfe687815877351315ffc0c5ed))

### Added
- Added the ability to remove a featured image ([10b0019](https://github.com/cnvs/canvas/commit/10b0019f61b7a5d3ff22843fd0ef250ffab689c0))

### Fixed
- Fixed the missing featured image caption translation ([c5f26b4](https://github.com/cnvs/canvas/commit/c5f26b4721a1de27d60d9f4e6bb39230fd3f767f))

## [v4.1.31](https://github.com/cnvs/canvas/compare/v4.1.30...v4.1.31) (April 28, 2019)

### Changed
- Refactored the `MediaController` into a single action for simplicity ([2201769](https://github.com/cnvs/canvas/commit/22017691233fabfcea16cb473ca64e1573dd751c))
- Refactored the `i18n` objects into single translation endpoints throughout the components for better maintainability ([0af8873](https://github.com/cnvs/canvas/commit/0af8873a90e26cf97ca9aec11c67f8851a11b36e))

## [v4.1.30](https://github.com/cnvs/canvas/compare/v4.1.29...v4.1.30) (April 26, 2019)

### Fixed
- Fixed the query scope for published posts ([be072bd](https://github.com/cnvs/canvas/commit/be072bd583e738ed7422cb31a171b73e4f8d5e2f))

## [v4.1.29](https://github.com/cnvs/canvas/compare/v4.1.28...v4.1.29) (April 26, 2019)

### Added
- Added multilingual support for French, Portuguese and Chinese (Simplified) ([#447](https://github.com/cnvs/canvas/issues/447), [f622b1e](https://github.com/cnvs/canvas/commit/f622b1e4864ecd1a526c79a467dda7b1aa1485ad))

## [v4.1.28](https://github.com/cnvs/canvas/compare/v4.1.27...v4.1.28) (April 22, 2019)

### Changed
- Added a `v-cloak` directive to the main editor component ([5d81ea4](https://github.com/cnvs/canvas/commit/5d81ea49d3d67b193274ff9b038344bb884d69f9))

## [v4.1.27](https://github.com/cnvs/canvas/compare/v4.1.26...v4.1.27) (April 17, 2019)

### Changed
- Refactored resource handling from the `register()` to the `boot()` method in the service provider ([#462](https://github.com/cnvs/canvas/pull/462)) 

## [v4.1.26](https://github.com/cnvs/canvas/compare/v4.1.25...v4.1.26) (April 11, 2019)

### Added
- Added a `PostTags` model ([0942a5b](https://github.com/cnvs/canvas/commit/0942a5b0b03b96e9ab1981fed18038fe8e7a9686))

### Fixed
- Skipped the `canvas:install` test ([#456](https://github.com/cnvs/canvas/issues/456), [53f21e6](https://github.com/cnvs/canvas/commit/53f21e67a8e1f004249b1bf21b2786b06ebeec99))

## [v4.1.25](https://github.com/cnvs/canvas/compare/v4.1.24...v4.1.25) (April 9, 2019)

### Added
- Added a unit test for precision number formatting ([8398356](https://github.com/cnvs/canvas/commit/8398356b819ce27d98895658277e0a6897613464))

## [v4.1.24](https://github.com/cnvs/canvas/compare/v4.1.23...v4.1.24) (April 8, 2019)

### Changed
- Changed the `laravel/framework` requirement to `illuminate/support` ([#453](https://github.com/cnvs/canvas/pull/453), [a1306c5](https://github.com/cnvs/canvas/commit/a1306c5c925f6357f6c150c4249e44505ce15c57), [b056182](https://github.com/cnvs/canvas/commit/b056182da87cc92403672cbf81f062a5ea72c171))
- Updated Unsplash links to open in new tabs ([2fe5658](https://github.com/cnvs/canvas/commit/2fe5658c363afea9b03ad270353f9659bab19494))
- Refactored the `storage_path` configuration to less explicit with images ([b0ab792](https://github.com/cnvs/canvas/commit/b0ab7926446d018461ca9a644a2ac571ad6eb046))

## [v4.1.23](https://github.com/cnvs/canvas/compare/v4.1.22...v4.1.23) (April 5, 2019)

### Fixed
- Fixed the removal of all topics and tags from a post ([e83930f](https://github.com/cnvs/canvas/commit/e83930f7e6b62e70e8d66af3601f56dc21200e1a))

## [v4.1.22](https://github.com/cnvs/canvas/compare/v4.1.21...v4.1.22) (April 5, 2019)

### Changed
- Updated the favicon to an .ico format ([08e8dc6](https://github.com/cnvs/canvas/commit/08e8dc6d6a6f52aeb0e4ae033caf7103761c32c1))

## [v4.1.21](https://github.com/cnvs/canvas/compare/v4.1.20...v4.1.21) (April 5, 2019)

### Changed
- Refactored the float parsing on stat view counts ([ea53999](https://github.com/cnvs/canvas/commit/ea539996fde96c5caedbcaa4ae10ac1a5b3b12fe))

### Fixed
- Included the post body in the stats index endpoint to not break the read times ([111291f](https://github.com/cnvs/canvas/commit/111291fa20ee910474467cc03aabc03a232b1a30))

## [v4.1.20](https://github.com/cnvs/canvas/compare/v4.1.19...v4.1.20) (April 4, 2019)

### Added
- Added dynamic pagination to Vue component filtered lists ([ec087a4](https://github.com/cnvs/canvas/commit/ec087a4fcea738775df95df2d795e695b12d6b1d))

## [v4.1.19](https://github.com/cnvs/canvas/compare/v4.1.18...v4.1.19) (April 3, 2019)

### Changed
- Removed unnecessary eager loading from the post index route ([09d01c6](https://github.com/cnvs/canvas/commit/09d01c622f04997dc23ae64ac9719a067a28b734))

### Added
- Added unit tests for the `ViewThrottle` middleware ([087832e](https://github.com/cnvs/canvas/commit/087832eb6b7439dbe0f9214fea99020e9eaeed39))

### Fixed
- Refactored the `ViewThrottle` middleware to prune posts from the session instead of simply filtering ([087832e](https://github.com/cnvs/canvas/commit/087832eb6b7439dbe0f9214fea99020e9eaeed39))

## [v4.1.18](https://github.com/cnvs/canvas/compare/v4.1.17...v4.1.18) (April 2, 2019)

### Changed
- Removed the unnecessary auth check ([4e36d8c](https://github.com/cnvs/canvas/commit/4e36d8ca28939b06c3cbf23345b7c74eeae8fe6a))
- Version bump for dependencies ([fa661ea](https://github.com/cnvs/canvas/commit/fa661eafce842bcd78caf95b80fd1911ce912e05), [2c1feeb](https://github.com/cnvs/canvas/commit/2c1feeb282e1cbd319e3d8f096f052cf679ec255))

## [v4.1.17](https://github.com/cnvs/canvas/compare/v4.1.16...v4.1.17) (March 30, 2019)

### Changed
- Minor branding updates ([6321678](https://github.com/cnvs/canvas/commit/63216782a497a1dc4434a806eaef100e8cac0255))

## [v4.1.16](https://github.com/cnvs/canvas/compare/v4.1.15...v4.1.16) (March 29, 2019)

### Changed
- Updated the `Model::all()` usages to reduce the query sizes ([6655ecb](https://github.com/cnvs/canvas/commit/6655ecb78123e1a179c8514d85e02f9aa5d77c87), [0df1ba5](https://github.com/cnvs/canvas/commit/0df1ba52b8a972fcdc6d01f78c0af2c0a5c72c54))
- Refactored model attributes to use snake case ([d2f4784](https://github.com/cnvs/canvas/commit/d2f47840d75386f496ea9ff81a9baeb44841dd4c))
- Updated the Font Awesome library to 5.8 ([47af5b8](https://github.com/cnvs/canvas/commit/47af5b8bf11f3d62d7a189a6fc9bfb201a9fdac4))
- Updated the dark mode contrast ratios for increased readability ([a718b1b](https://github.com/cnvs/canvas/commit/a718b1bfa13223a9e73d233d336340978ea84f68))

### Added
- Added unit tests for the `StoreViewData` listener ([2e3aeb5](https://github.com/cnvs/canvas/commit/2e3aeb518aee9141fdec6485ca2c3844a7f98d24))
- Added unit tests for the `canvas:publish` Artisan command ([637dd3f](https://github.com/cnvs/canvas/commit/637dd3fb2b1a1efd6a2c67fbeb77038737e8d725))

### Fixed
- Fixed the missing validation messages on Topics/Tags ([4d4231b](https://github.com/cnvs/canvas/commit/4d4231bd7da898e7ee28c38864944ede281cbb8d))

## [v4.1.15](https://github.com/cnvs/canvas/compare/v4.1.14...v4.1.15) (March 23, 2019)

### Added
- Added a dark mode ([e3723ac](https://github.com/cnvs/canvas/commit/e3723ac6523ef000b0901f3c073a94bcad7cfebf))

## [v4.1.14](https://github.com/cnvs/canvas/compare/v4.1.13...v4.1.14) (March 22, 2019)

### Fixed
- Fixed a plurality bug in the line chart components ([dc366f1](https://github.com/cnvs/canvas/commit/dc366f117c7b765d35a352bd996722f0745e17b1))
- Fixed the percentage calculations with popular reading time stats ([6222eb](https://github.com/cnvs/canvas/commit/6222ebb38654ca0c0ec17ee881977a027a6d72a0))

## [v4.1.13](https://github.com/cnvs/canvas/compare/v4.1.12...v4.1.13) (March 21, 2019)

### Changed
- Refactored the test suite to be more concise and accurate ([573b6e8](https://github.com/cnvs/canvas/commit/573b6e877933fc4e0d2ef46a0686650304b5a9f8))
- Refactored the migrations into a root `database` directory ([573b6e8](https://github.com/cnvs/canvas/commit/573b6e877933fc4e0d2ef46a0686650304b5a9f8))
- Updated the `.gitignore` ([a83978b](https://github.com/cnvs/canvas/commit/a83978b63fe2d1e4b25551cd9bf81a3f9ecbb908))

### Added
- Added unit tests for the number suffix helper ([61d5b15](https://github.com/cnvs/canvas/commit/61d5b15eaee6bdf9571e5687cca9f80d4e309fe3))
