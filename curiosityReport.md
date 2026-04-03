<h1> YAML -- What the Heck Is It? </h1>
<h2>Introduction </h2>
YAML is something I used in this class, obviously, and also something that I've used at work a number of times since we use bitbucket pipelines. I knew it was a type of file you use for executing stuff when you push it to a repository, and that's pretty much what we learned in this class to. But I wanted to know more of what it was -- it's unlike pretty much every other kind of file I know, some kind of weird mix between a set of SQL-esque commands and a JSON? I don't know. So that's what I wanted to find out. 
<h2>History of YAML</h2>
<ul>
<li>Was first called "Yet Another Markup Language"</li>
<li>Creators changed the name to "YAML Ain't Markup Language</li>
<li>This was done to emphasize it as data-oriented rather than just for document markup</li>
<li>Command line editors like Vim and Emacs have built in support for linting YAML files</li>
</ul>
<h2>What does YAML's competition look like?</h2>
YAML has both advantages and drawbacks over other file types that can be used for configuring pipelines, as you might expect. 
<ul>
<li>YAML's advantage over JSON is that it is more configurable/customizable through relational keys, data types that you can define yourself, and comments. Its disadvantage is that JSON is faster</li>
<li>YAML's advantage over something called TOML (that I hadn't heard of before) is minimal -- it's more preference of indentation-based (YAML) vs indicator-based (TOML) with the indicators being things like "" and [] </li>
<li>YAML's advantage over XML is that it generally relaxes the need for a validator in a lot of situations because of its built in type declarations</li>
<li>There are a few notable direct alternatives to YAML (like StrictYAML) that are based on the same data-oriented concepts but that seek to undo some of YAML's drawbacks, like sometimes-ambiguous typing and the lack of explicity terminators</li>
</ul>
<h2>YAML Implementation in Larger-Scale and More Complex Projects</h2>
YAML was hard to use sometimes in our class. It's a little clunky, hard to make sure that the indentation is right, and adding in new things and new structures can be daunting. In a large scale project with potentially extremely varying data structures this is unfeasible. That's why there is actually a lot of library support in different languages for building YAML files. 
<br>
This was actually SO cool to learn about! Basically, there are parsers and emitters for building and interpretting YAML files. In simple cases, YAML can just be parsed with regex and emitted with print statements. In more complex cases, that becomes unfeasible. That's when you'd use parsers and emitters.
<br> 
The way that a YAML parser works (at a high level) is by converting YAML from human-readable into machine-interpretable. It's essentially just a lot of regex, but under the hood so that the developer doesn't have to worry about it. I thought that was pretty cool, but emitters are what really caught my attention.
<br>
The way that a YAML emitter works is almost like a kind of middleware. In C, C++, Python, and others, you can actually generate YAML code in-line for a data structure you're creating, using, or manipulating. Basically, you can import and define an emitter that can then be called on your data structure. That emitter will then format and "print" the proper YAML representation of that data structure!
<br> 
Using emitters and parsers allows YAML files to be dynamically generated rather than static, which I think is <i>such</i> a cool idea!
<h2>Where YAML Is Now</h2>
YAML has actually evolved beyond all of this! It's even more than what we've used it for in class, which is kind of crazy
<br>
<ul>
<li>As of 2022, YAML has branched out beyond just data serialization</li>
<li>There is actually an extended version of YAML called YS (pronounced wise)</li>
<li>It seeks to move beyond data serialization and be a general-purpose programming language!</li>
<li>I tried but couldn't find any examples of companies using it</li>
<li>This does mean that you could have both a project and a pipeline using only .yaml/.yml files -- a homogenous workflow most projects can only dream of</li>
</ul>
<h2>Connection to Our Course</h2>
Obviously we want to make things as easy for ourselves as possible when developing applications. Learning that you can dynamically generate YAML files and that you could feasibly build a javascript-like project using <i>just</i> YAML definitely opened me up to an entire world of possibilities that I really want to try out. I think that the idea of synthesizing project code and pipeline code by closing the gap between the two is very much in line with the idea of infrastructure as code as well. 
<h2>Conclusion</h2>
<ol>
<li>YAML is cool as heck</li>
<li>The people who created (and now maintain) YAML seem cool as heck</li>
<li>I don't know much about the alternatives, but it seems like the best out of all of them</li>
<li>Having linter support in Vim is kind of a flex, I think</li>
<li>Coding an app and configuring its deployment <i>using only one language?</i> Out of this world, man</li>
</ol>