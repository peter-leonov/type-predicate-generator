# How is Generator different

This doc compares Generator to three kinds of type checkers:

- pure runtime type checkers
- `tsc` plugin based transpilers
- code generators

Generator belong to the latter kind.

## Preamble

First and foremost, my sincere respect to all the tool makers, and especially to those involved in designing, implementing, testing and documenting all and every of the tools I'm comparing Generator to in this post. Keep up the great work, folks!

## Table of contents

Some of the points are duplicated to ease the scoped reading experience.

TODO

## Comparing to the pure runtime checkers

The most popular library in this category is the infamous [zod](https://zod.dev).

Type checkers in this category use only the code that the JavaScript engine runs within an application. No type information is used inside of this class of libraries. Some of them use `eval` to turn a schema into JS code in runtime, some like `zod` use pure function composition.

### Generator produces code that is over 200 times faster

TODO: give a screenshot

The main reason is that Generator produces specialized code that is easy for all the modern JS engines to optimize. Each type predicate function consists of trivial instructions (like `typeof x === "string"` and `x === "constant"`) that in most cases don't even call any other functions and never any external or shared functions. JIT JavaScript engines like when code types are local and when for each distinct type there is a separate small function. This helps JS engines to specialize these small functions in runtime. See [this amazing article](https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html#:~:text=stands%20in%20the%20way%20of%20inlining) for more details on how V8 deals with polymorphic functions.

Pure runtime checkers like `zod` instead use function composition. In this case basic building block functions (like `hasProperty(object, propertyName)`) get reused with values of different types and thus different [hidden classes](https://v8.dev/docs/hidden-classes). This leads to frequent [deoptimizations](https://github.com/P0lip/v8-deoptimize-reasons) (falling back to the slower non-optimized byte code instead of the faster native code). In the most sewear cases the JIT compiler might [oscillate between optimizing and then deoptimizing](https://hacks.mozilla.org/2017/02/a-crash-course-in-just-in-time-jit-compilers/#:~:text=If%20you%20have%20code%20that%20keeps%20getting%20optimized%20and%20then%20deoptimized%2C%20it%20ends%20up%20being%20slower%20than%20just%20executing%20the%20baseline%20compiled%20version.) a code path for one type and then another spending a lot of cycles in just compiling the code instead of actually running it.

### Generator does not have any runtime dependencies

The code that get's into the bundle is the exact code you see in the `git diff` output in your project after generating the type predicates. The only other code the predicate uses is the built-ins like `Array.isArray()` ([safely wrapped](https://github.com/peter-leonov/type-predicate-generator/blob/42d725c113cc778b9b742e5f2736cba4c52ca866/generator/src/generator.ts#L461)!). This means that the bundle real estate Generator uses for the predicates stays minimal. It grows linearly with the size of types. The net amount of code used to define a zod type is comparable to the size of an average predicate after minification.

Purely runtime type checkers by design are a runtime dependency. They require the runtime library of matchers to be included in the resulting bundle. Most of the libraries use handy constructors that are flexible enough to allow most of the checks a general API would need. This is great, but also affects the bundle size ([60+ KB](https://bundlephobia.com/package/zod@3.24.1) for `zod`) because the more generalized matchers cannot be tree shaked statically (here is [an interesting attempt](https://dev.to/mizchi/lizod-spiritual-successor-of-zod-less-than-1kb-4i67) on dealing with the bundle size).

Another emerging issue with the runtime-only complex libraries that are used in performance and avalability critical parts of the application is compile time compatibility with the [WinterCG](https://wintercg.org) runtimes. Heavy runtime libraries tend to target feature rich runtimes like Node and throw in runtime for corner cases like error message generation requiring more testing. This is not an issue if you're on a widely supported platform like Node or the latest browsers, but if you're investing in, say, [Wasmer Edge](https://www.secondstate.io/articles/run-javascript-in-webassembly-with-wasmedge/), adding a seemingly trivial dependency might turn into a turmoil.

### Generator produces TypeScript code that is strictly type safe

This is one of the key distinctive features of Generator. The code produced by Generator that gets into your app bundle first gets checked by your app's TypeScript setup to verify it's safe internally and matches the types being checked. Generator plays well here by producing strictly type safe code that is gonna compile even in a strictest configurations. What is also handy is that when you make a change to the type that has a generated predicate the `tsc` reminds you to update the predicate too (by just re-generating it).

The purely runtime checkers cannot directly use the power of TypeScript to verify that the composed function has all the required checks in the right order. Even a proper TypeScript type predicate that does not use at least the `satisfies` type operator can easily fool itself by just returning `true` for any input value without making sufficient enough checks.

```ts
function isUser(value: unknown): value is User {
  return true; // TypeScript blindly trust us here
}
```

Of course, the production ready libraries like `zod` use TypeScript internally to check the library code correctness and provide utility functions to infer types from the runtime building blocks. This helps with improving the code reliability by far compared to some purely JavaScript libraries. But even this still does not let the `tsc` of your project verify the final code correctness on its own. There is alway some wrapping/linking/helping code that cannot be verified.

### Generator produces code that is readable and modifiable

For the cases when there is a blocking feature that the generated predicate does not support or there is a bug in it that requires urgent fixing the code produced by Generator is readable and can be immediately edited. As the type predicate code does not change often there would be no pressure to send patches upstream to the Generator source code (even though highly appreciated!). Such a quick fix would be trivial to review in a tiny PR and remain local to the predicate in question allowing to unblock the team without any sync dependencies on the Generator's development process.

In case of a runtime library a fix would require a patch to the library itself to be able to mitigate the issue. Such a patch would touch all the code that is checked by the library and require more thorough testing. A short lived fork might be an option here, but would require to find out how to run the build and publish pileline of a given tool.

### Generator does not require to define types using a custom DSL

Generator takes in any type defined in any part of the application using just native TypeScript. Even a type from a third-party library or a different team's public type that doesn't use any runtime type checker. It's just types, everything is compatible and composable.

Contrary to this, by design, all of the runtime checkers provide a set of classes or functions that form the final type checker instance that is used to check the values. Most of them require to infer the resulting type from the resulting compound function. This effectively turns the runtime generators into DSL-first libraries (popular in [Ruby world](https://github.com/davidgf/design-patterns-in-ruby/blob/master/dsl.md)) instead of being truly TypeScript first. This way the focus shifts to more schema-centric approach of consuming APIs where TypeScript is more of a powerful secondary tool than a primary target.

### Generator produces code that is way faster to cold start

This is by design, the generated code is simply more performant to deal with for JS engines. JS engines developed lots of tricks to make the initial parsing as fast as especially including [lazy parsing](https://v8.dev/blog/preparser). The code that Generator produces is native for such optimizations as it's no different to any other production code that constitutes the rest of your app. It is also trivial to [three shake](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking).

The runtime checkers approach by design requires some code to be run at the startup that forces the JS engine to parse, compile and execute the library code no matter if the predicate is going to be used or not right away. It is possible thought to wrap the runtime checkers in factory functions to mitigate the issue, but the runtime library code still has to get into the bundle and get parsed at the startup.

Note that there are JavaScript runtime environments that rely on heap snapshots ([V8 snapshots](https://v8.dev/blog/speeding-up-v8-heap-snapshots), [WASM](https://bytecodealliance.org/articles/making-javascript-run-fast-on-webassembly)-based JS engines) that allow to make a snapshot of the JS engine memory after the app has been initialized. If this reminds you a [preforking network daemon](https://httpd.apache.org/docs/2.4/mod/prefork.html), than it's a really close analogy. These environments can help with significantly improving the cold start times for the runtime checkers but still at the expense of more memory usage as the final checker function has to be constructed in the heap even when not used.

### Generator does not use `eval()`

Generator compiles the predicate code during the build step and does not require `eval()` and friends that are not available in high performance and secure runtimes like [Vercel Edge Runtime](https://vercel.com/docs/functions/runtimes/edge-runtime#:~:text=Description-,eval,-Evaluates%20JavaScript%20code), [AWS CloudFront](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-javascript-runtime-20.html#:~:text=to%20security%20concerns.-,Dynamic%20code%20evaluation,-Dynamic%20code%20evaluation), [Cloudflare Workers](<https://developers.cloudflare.com/workers/runtime-apis/web-standards/#:~:text=are%20not%20allowed%3A-,eval(),-new%20Function>) and [Akamai EdgeWorkers](<https://techdocs.akamai.com/edgeworkers/docs/specifications#:~:text=new%20Function%20()%20and-,eval,-in%20the%20API>).

The runtime checkers that use `eval()` and friends in runtime to allow for the JIT optimizations introduce even more steps for the JS engine to make before the actual code of a type predicate can be run. The `eval()` approach requires the library to build a predicate source code as a string usually combining it out of smaller string that then have to be garbage collected, tell the JS engine to parse it and only then execute. While flexible this approach introduces additional startup latency, memory consumption and overall more demanding requirements to the runtime environment.

I should mention here that using `eval()` is a potential [security issue](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_direct_eval!:~:text=enormous%20security%20risk). The resulting artifact can be considered by security audit tools as potentially vulnerable. Honestly, it should not be a real issue in case of a type checker library especially if the used library source code is frequently audited and comes from a trusted source.

### Easier debugging and better stack traces

Every library from time to time introduces or reveals a bug. With Generator the source code that might raise an exception is explicitly bundled with your app and covered with source maps. Using a step debugger on the generated code is the same experience as stepping through your own app code. The stack trace in the error reporting tool is going to be crystal clear too. Such a bug can rarely happen within a code like that Generator produces, but it's still possible e.g. when a [`Proxy`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) object throws on property access or a [getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) returns an unexpected `null`, or a library misuses [patching global `prototype`s](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain#:~:text=misfeature%20is%20called-,monkey%20patching,-.%20Doing%20monkey%20patching).

A runtime library in most cases would produce a stack trace with minified symbols. This is especially visible if used with the new [native support for TypeScript](https://nodejs.org/en/learn/typescript/run-natively) in Node.js where there are no source maps in use at all.

### Native IDE experience

Generator's code is trivial to navigate to through every IDE's "goto definition" feature. The hover types are also just the exact types used in your application, no added wrappers or renaming. Plus, the actual code of the type predicate is available a click away in case you'd need to modify it.

In case of `zod` you'd see the inferred types that cannot have other neat features like type level JSDoc (property level JSDoc [works though](https://github.com/colinhacks/zod/issues/200#issuecomment-1198922371)) or type level generics (runtime workaround [exists](https://spin.atomicobject.com/typed-generic-validator/) but requires some effort).

### Generator produces code that is easy to review

Another benefit of having explicitly generated code version controlled in your repository is that it's trivial to audit. Starting with all the changes immediately visible during PR review through GitHub-based code scanners. This also makes upgrading Generator package trivial as all the changes the new version introduces into the generated code are immediately visible in the project `git diff` and are covered by the [generated unit tests](https://github.com/peter-leonov/type-predicate-generator/issues/18).

For the sake of completeness on the topic of safety and touching a bit the [supply chain security](https://www.youtube.com/watch?v=kCj4YBZ0Og8), the users of a runtime library are still running a compiled to JS source code of the runtime checker that can theoretically be anything as the `*.d.ts` files don't provide post build verification for the `*.js` code that comes in the library bundle. So, for the more safety and security strict applications the ability of having the actual code verified by the project's set of security tools can be important.

## Comparing to TypeScript compiler plugins

The most popular and feature rich tool in this category is [Typia](https://typia.io).

The type checkers in this category generate the type predicates code during the build step. They hook into the `tsc` compiler as plugins and provide type level helper types that get transpiled into the actual JavaScript code during code generation stage of the `tsc` compilation pipeline.

### Generator does not require `tsc` plugins

Generator is a standalone tool that has it's own TypeScript version bundled inside that does not interfer with your app's TypeScript setup. Even if Generator breaks during an upgrade the predicates code it has generated is already checked into your repository and is not going away. The code is rather static and does not strictly require Generator to even be part of the build pipeline you can simply code the code from the [Playground](https://peter-leonov.github.io/type-predicate-generator/).

As TypeScript does not officially support plugins for `tsc` the checkers that rely on hooking into `tsc` require patches to the `tsc` itself. This is a blocker for most teams that want to run vanila TypeScript compiler for different reasons. Mostly it's reliability as TS is the safety net that proves the code will work in production.

Another issue with having `tsc` plugins is that major TypeScript updates tend to introduce breaking change to the internal APIs. This in an optimistic case just breaks the plugins and errors out. In a more tricky case the plugin is going to continue working but might produce invalid code. This in its strictest requires the app developer wait till all the plugins have upgraded their TypeScript support, upgraded their tests suits and published the updated package. In projects with strict SLAs this might also require waiting some time till the comunity adopts the freshly published package.

I have to admin that `tsc` plugins provide elegant APIs that I personally like the most as a programming language enthusiast. But strictly speaking TS plugins extend the language as a whole and are not in line with the course [TypeScript](https://github.com/microsoft/TypeScript/wiki/TypeScript-Design-Goals) and the rest of community (see reasoning and comments [here](https://github.com/microsoft/TypeScript/issues/59601)) is taking since long time. A bit sad, but otherwise we would have gotten another JS fork (like [CoffeeScript](https://coffeescript.org/#introduction) or Facebook's [Flow](https://medium.com/flow-type/announcing-component-syntax-b6c5285660d0)) by now.

### Generator produces type safe TypeScript

As mentioned above [Generator produces TypeScript code that is strictly type safe](#generator-produces-typescript-code-that-is-strictly-type-safe) and is checked by your `tsc` setup according to the safety rules of your project.

The TS plugins instead produce JavaScript code that is not type checked by the TypeScript compiler meaning that this part of the code that your project runs is still purely JavaScript even though coming from the TypeScript compiler. Of course, the tool creators test the output code really well, but you still have to outsource the type safety to the external tool build pipeline.

### Genarator code is explicitly readable and modifiable

As mentioned above [Generator produces code that is readable and modifiable](#generator-produces-code-that-is-readable-and-modifiable)

To check what a `tsc` plugin-based checker actually produces you'd need to extract the generated code from the compilation pipeline. That code is purely JavaScript which would require you to manually check the produced code correctness.

The fact that the produced code is in most setups not checked into the repository making the package upgrades a multi-step process. To make sure that the new version of the plugin based checker produces comarable code you'd need to save somewhere the current emitted code, upgrade the package and run a diff. With Generator this comes out of the box.

The only downside of that Generator produces files is the explicit build step. With a `tsc` plugin the is no code to worry about, the plugin keeps the predicates always up to date. Still, not all the build and development tools support hot reloading with full `tsc` plugin support (example [issue](https://github.com/samchon/typia/issues/812) that took almost a year to fix).

### Generator code shareable across project boundaries

It's just a tiny TS file that any JS ecosystem tool can consume as is, along the rest of your application code.

If you needed to share your TypeScript source code that uses `tsc` plugins with other teams you'd have to first publish it. This requires compiling the code down to a JavaScript bundle and publishing along with the `\*.d.ts` files. Another way is to make other teams use the same set and versions of `tsc` plugins including the checker plugin in their setup too. This requires some coordination and might slow down migrations to the newer TypeScript versions. Another blocker might come from the teams that are not building their project with `tsc` and instead use the new tools that natively understand TypeScript syntax and do not require a separate build step ([Node.js native TS support](https://nodejs.org/en/learn/typescript/run-natively), [esbuild](https://esbuild.github.io/content-types/#typescript), [Cloudflare wrangler](https://developers.cloudflare.com/workers/languages/typescript/)).

### Generator emitted code is easy to debug

As mentioned above in [Easier debugging and better stack traces](#easier-debugging-and-better-stack-traces) Generator emits code that is friendly to debuggers and error reporting tools. The stack traces are native to your application giving instant feedback on where the error originates from (both the validation errors and potential runtime errors).

In the `tsc` plugin case during debugging and reading stack traces the source maps are gonna point only to the single symbol in the source TS code (in most cases the `is<MyType>` token). In case of an issue or a bug with the source code or the checker itself it's required to inspect the raw JavaScript bundle instead.

There is a workaround though. It should be possible to publish both source maps for your app's bundle and for the dependencies and set the error reporting tool up to look for the source maps there. Quick googling did not show definitive results on how to deal with transitive source maps though.

### Generator supports all the JS/TS tools

The predicate code is easy to use with the new Node.js TypeScript strip feature. No need to use `ts-node` or precompile the code with `tsc`. The same applies to the various test runners and edge runtime bundlers.

With a `tsc` plugin you're locked withing the `tsc` centric infrastructure. It's not something particularry challenging, but might require additional setup and degrate performance. For example, Vite transpiles `*.ts` files [20-30x times faster](https://vite.dev/guide/features#:~:text=JavaScript%20which%20is-,about%2020~30x,-faster%20than%20vanilla) with the default `esbuild` compiler than with `tsc`. The new super fast [ts-blank-space](https://github.com/bloomberg/ts-blank-space) package does not even run TypeScript type analysis that is required for `tsc` plugins to work and through this is also blazing fast.

So, once again, extending the type system that affects resulting syntax effectively turns this category of checkers into a [language extention](#generator-does-not-require-tsc-plugins).

## Comparing to the other code generators

The most complete (and dear to my heart as I've used it in the past) tool in this class is [ts-auto-guard](https://github.com/rhys-vdw/ts-auto-guard).

This class of checkers produce the final predicate code as distinct files that should be explicitly imported into the application code and build with the rest of the code. Generator falls into this category of runtime type checkers.

Most of the arguments above in favour using Generator more or less apply to all of the tools in this category.

### Generator produces type safe TS

As mentioned above [Generator produces TypeScript code that is strictly type safe](#generator-produces-typescript-code-that-is-strictly-type-safe)

Other code generators that also produce TypeScript emit code that is not type safe. The not safe emitted code uses unsafe constructions like type casting (with `as`) or can rely on the unsafe types (mostly `any`). This effectively turns the produces TypeScript code into loosely typed JavaScript. If your application's setup uses strict TypeScript linters the produces code would require adding exceptions and lower the overall type safety score.

### Generator produces readable code

As mentioned above [Generator produces code that is readable and modifiable](#generator-produces-code-that-is-readable-and-modifiable). In addition to this, compared to other code emitting tools Generator helps you with reading, debugging and potentially manually changing the generated code by linearizing all the checks. It makes small steps that are easy to navigate and add comprehensive comments (coming soon!). This means that the produced code is not minified, but is still organized in the way that common bundler minifies can easily turn it into a tiny combined `if` expression anyway. Generator also tries to use meaningful local variable and temporary type names where possible to improve reading experience.

The code produced by most of the other tools in this category is pre-optimized and thus not really readable. This gives better control to the tool maker to achieve the best performance as not all the bundlers can infer how to deal with rather complex predicate functions for the more complex types.

### Generator always produces correct code

### Generator code is fast

Small disclaimer here. Most of the type-to-code generators show significantly (100x) better performance than purely runtime solutions and sensibly better startup times compared to those that use `eval` (TODO: run benchs).

Generator accesses object properties only once broadly reusing local variables that makes the code extremely fast (example). This does not require too much of the JS engine to optimize on cold start.

Most other checkers form full or partial nested property access expressions that take some time for the JS engine to identify and optimize.

### Generator also tests the generated code

As part of the predicates generating Generator also optionally dumps a load of unit tests that you can run next to your app test suite.

AT the moment this is a rather unique feature that I hope is gonna be picked up by other tool makers. Read about the approach here: ggggg

## ChatGPT

Yep, seriously.

You can trust the produced code as Generator is too trivial to hallucinate. Generator responds with an error to the types it cannot convert instead of producing incorrect code.

I tried Copilot and ChatGPT. Both AI tools produced unsafe TS that could not even compile without errors no matter what prompt I used. ChatGPT simply broke in the middle of the code generation with completely out of context symbols.

## Footnotes

In some cases the code produced by other tools might have seemed incorrect to me for some tricky corner cases. While it's of course possible to go and fix the tool, I decided to challenge the approach as a whole. This is why Generator is a tool that is dead simple inside by relying on other tools to produce the code (TS API) minify the code (esbuild), makes the produced code strictly type safe (using `satisfies` operator) and augments it all with a unit test generator (using JS generators). It's not only that Generator's code base is simple, but also the feature set is minimal.

Under the hood Generator uses the ViewModel-like architecture to separate the module layers to foster independent development and testing. This means that when TypeScript breaks their public API next time it's gonna be trivial to identify where and provide a fix for just one layer. In theory, the layered architecture allows to plug any type system that describes JS into Generator and still produce the same predicate code. I sincerely hope that we as JS community are gonna settle on TypeScript though.
