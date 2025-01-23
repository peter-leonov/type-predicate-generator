# How is Generator different

Table of contents

## Preamble

First and foremost, my sincere respect to all the tool makers, and especially to those involved in designing, implementing, testing and documenting all and every of the tools I'm comparing Generator to in this post. Keep up the great work, folks!

## Pure runtime checkers

The most popular library in this category is the infamous zod.

Some of the points below can be applied to all the build time code generators, but there are some that are unique to Generator.

### Generator produces code that is over 200 times faster

The main reason is that Generator produces specialized code that is easy for all the modern JS engines to optimize. Each type predicate function consists of trivial instructions (like `typeof` and `a === b`) that in most cases don't even call other functions. JIT engines like when code types are local and when for each distinct type there is a separate small function to specialize in runtime. See this amazing article (https://mrale.ph/blog/2018/02/03/maybe-you-dont-need-rust-to-speed-up-your-js.html#:~:text=stands%20in%20the%20way%20of%20inlining) for more details on how V8 deals with polymorphic functions.

Pure runtime checkers like zod instead use function composition. In this case basic building block function (like `hasProperty(object, propertyName)`) get reused with values of different types and thus hidden classes. This leads to frequent de-optimizations (falling back to the non-optimized code). In the most sewear cases the JIT compiler might oscillate between optimizing and then de-optimizing a code path for one type and then another spending a lot of cycles in just compiling the code instead of actually running it.

### Generator does not have any runtime dependencies

The code that get's into the bundle is the exact code you see in the git diff in your project after generating the type predicate. The only other code the predicate uses is the JS built-ins like `Array.isArray()`. This means that the bundle real estate Generator requires for the predicates stays minimal and grows linearly with the size and number of the predicates. The net amount of code used to define a zod type is comparable to the size of an average predicate after minification.

### Generator produces TypeScript code that is strictly type safe

This is one of the key distinctive features of Generator. The code that gets into your app bundle first gets checked by TypeScript to verify it's safe. Generator plays well here by producing strictly type safe code that also gets checked by your app's build pipeline.

The purely runtime checkers cannot directly use the power of TypeScript to verify that the composed function has all the required checks. Even a proper TypeScript type predicate that does not use at least the `satisfies` type operator can easily fool itself by just returning `true` for any input value without making sufficient enough checks. Of course, the production ready libraries like zod use TypeScript internally to check the library code correctness and provide utility functions to infer types from the runtime building blocks. This helps with improving the code reliability by far compared to purely JS libraries, but still does not let the TS type engine verify the final code correctness on its own, there is alway some more helping code that cannot be verified.

### Generator produces code that is modifiable

For the cases when there is a feature that the library does not support or there is a bug that needs fixing and the checking library is involved the code that is produced by Generator is readable and immediately editable. As the type predicate code does not change often there would be no pressing urge to send patches upstream to the Generator source code (even though highly appreciated!). A fix of this sort would be trivial to review and local to the predicate in question allowing to unblock the app faster.

In case of a runtime library a fix would require a patch to the library itself to be able to mitigate the issue. Such a patch would touch all the code that is checked by the library and require more thorough testing.

### Generator does not require to define types using a custom DSL

Generator takes in any type defined in any part of the application using just native TypeScript. Even a type from a third-party library or a different team's public type that doesn't use the same runtime type checker. It's just types, everything is compatible and composable.

Contrary to this, by design, all of the runtime checkers provide a set of classes or functions that form the final type checker. Most of them require to infer the resulting type from the resulting compound function. This effectively turns the runtime generators into DSL-first libraries (used to be very popular in the past in the Ruby community) instead of TypeScript first. This way the focus shifts to more schema-centric approach to consuming APIs where TypeScript is more of a powerful secondary tool that the primary target.

### Generator produces code that is way faster to cold start

This is by design, the generated code is simply more performant to deal with for JS engines. JS engines developed lots of tricks to make the initial parsing as fast as possible including lazy parsing. The code that Generator produces is native for this set of optimizations. It is also trivial to three-shake.

The runtime checkers approach by design requires some code to be run at the startup that forces the JS engine to parse, compile and execute the library code no matter if the predicate is going to be used or not right away. It is possible thought to wrap the runtime checkers in factory functions to mitigate the issue, but the runtime library code still has to get into the bundle and get parsed at the startup.

There are environments that rely on JS heap snapshots (V8, Wasmer) that allow to make a snapshot of the JS engine memory after the app has been initialized. These environments can help with significantly improving the cold start times for the runtime checkers but still at the expense of more memory usage as the final checker function has to be constructed in the heap even when not used.

### Generator does not `eval()` code at runtime

Generator compiles the predicate code during the build step and does not require `eval()` and friends that are not available in hight performance and secure runtimes like AWS CloudFront, Cloudflare Workers and Akamai EdgeWorkers.

The runtime checkers that use `eval()` and friends in runtime to allow for JIT optimizations introduce even more steps for the JS engine to make before the actual code of a type predicate can be run. The `eval()` approach requires the library to build a predicate source code as a string, tell the JS engine to parse it and only then execute. While flexible this approach introduces additional startup latency, memory consumption and overall more demanding requirements to the runtime environment.

### Easier debugging and better stack traces

Every library from time to time introduces or reveals a bug. With Generator the source code that might raise an exception (e.g. a Proxy object that throws on property access) is explicitly bundled with your app and covered with source maps. Using a step debugger on the generated code is the same experience as stepping through your own app code.

A runtime library in most cases would produce a stack trace with minified symbols. This is especially visible if used with the new native support for TypeScript in NodeJS where there are no source maps in use at all.

### Native IDE experience

Generator's code is trivial to navigate to through every IDE's "goto definition" feature. The hover types are also just the exact types used in your application, no added wrappers or renaming. Plus, the actual code of the type predicate is available a click away in case you'd need to modify it.

### Generator produces code that is easy to review

Another benefit of having explicitly generated code is that it's trivial to audit. This makes very easy to upgrade the Generator's version as all the changes the new version introduces into the generated code are immediately visible in the project git diff.

For the sake of completeness on the topic of safety and touching a bit the supply chain security (https://www.youtube.com/watch?v=kCj4YBZ0Og8), the users of a runtime library are still running a compiled to JS source code of the runtime checker that can theoretically be anything as `*.d.ts` files don't provide any verification for the `*.js` code that comes in the library bundle. So for the more safety and security strict applications the ability of having the actual code verified by the project's set of security tools can be important.

## Than `tsc` plugins like `typia`

### Generator produces type safe TypeScript

Copy type safety

They produce JS code that is not type checked by the TS compiler meaning that this part of the code that your project runs is still purely JS. Of course, the tool creators test the output code well, but you have to outsource safety here.

### Genarator code is explicitly readable

To check what a tsc-based checker actually produces you'd need to extract the generated code from the compilation pipeline. That code is purely JS which would require you to manually check correctness.

### Generator code is trivial to share

It's just a tiny TS file that any JS ecosystem tool can consume as is along the rest of your app code.

If you want to share your typescript source code with other teams you'd need to first compile it down to JS and publish along the `\*.d.ts` files or make other teams use the same tsc plugin in their setup too. This might be an issue if they are not building their project with tsc or even use the new native TS syntax support in node that does not require a separate build step.

### debugging copy

During debugging and reading stack traces the source maps are gonna point only to the single symbol in the source TS code. In case of an issue or a bug with the source code or the library it's required to inspect the raw JS bundle instead.

### Generator supports all the JS/TS tools

The predicate code is easy to use with the new nodejs TS strip feature. No need to use ts-node or precompile the code with tsc. want to use vite with super fast type-to-spaces TS transformer? Generator supports this as does the rest of your app code.

The ts plugin based checkers have to rely on the tsc cli to generate the final JS code. This effectively turns this category of checkers into a language extention. See the new --only-removable-types https://github.com/microsoft/TypeScript/pull/61011

## Than other type-to-code generators like ts-…-guard

### Generator produces type safe TS

Copy type safe

Other code generators produce TS code that is not type safe. For example use unsafe type casting `as` or `any`. As the produced code is actually TS it gives better safety promises that using just JS.

### Generator produces readable code

To help with debugging and potentially manually changing the generated code Generator linearizes all the checks, make small steps that are easy to navigate and (coming soon) add comprehensive comments. The code still minifies into a tiny combined if expression where possible.

The code produced by most of the tools in this category is pre-optimized and thus not really readable. Generator does two distinct things to make the output code readable and editable. One is it turns

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
