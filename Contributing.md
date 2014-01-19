# Contributing to the caniuse data

The `features-json` directory includes JSON files for every feature found on [the caniuse.com website](http://caniuse.com/).
Maintaining these files on GitHub allows anyone to update or contribute to the support data on the site.

**Note:** when submitting a patch, don’t modify the minified `data.json` file in the root — that is done automatically. Only modify the contents of the `features-json` directory.

## How it works

The data on the site is stored in a database.
This data is periodically exported to the JSON files on GitHub.
Once a change or new file here has been approved, it is integrated back into the database
and the subsequent export files should be the same as the imported ones.
Not too confusing, I hope. :)

## Supported changes

Currently the following feature information can be modified:
* **title** — Feature name (used for the title of the table)
* **description** — Brief description of feature
* **spec** — Spec URL
* **status** — Spec status, one of the following:
	* `rec` - W3C Recommendation
	* `pr` - W3C Proposed Recommendation
	* `cr` - W3C Candidate Recommendation
	* `wd` - W3C Working Draft
	* `other` - Non-W3C, but reputable
	* `unoff` - Unofficial or W3C "Note"
* **links** — Array of "link" objects consisting of URL and short description of link
* **bugs** — Array of "bug" objects consisting of a bug description
* **categories** — Array of categories, any of the following:
	* `HTML5`
	* `CSS`
	* `CSS2`
	* `CSS3`
	* `SVG`
	* `PNG`
	* `JS API`
	* `Canvas`
	* `DOM`
	* `Other`
* **stats** — The collection of support data for a given set of browsers/versions. Only the support value strings can be modified. Values are space-separated characters with these meanings, and must answer the question "*Can I use* the feature by default?":
	* `y` - (**Y**)es, supported by default
	* `a` - (**A**)lmost supported (aka Partial support)
	* `n` - (**N**)o support, or disabled by default
	* `p` - No support, but has (**P**)olyfill
	* `u` - Support (**u**)nknown
	* `x` - Requires prefi(**x**) to work 
* **notes** — Notes on feature support, often to explain what partial support refers to
* **ucprefix** — Prefix should start with an uppercase letter
* **parent** — ID of parent feature
* **keywords** — Comma separated words that will match the feature in a search
* **shown** — Whether or not feature is ready to be shown on the site. This can be left as false if the support data or information for other fields is still being collected

## Adding a feature

To add a feature, simply add another JSON file to the directory with the base file name as the feature ID (only alphanumeric characters and hyphens please). If you want to submit a feature but don't have all information available for it yet, make sure you set the "shown" flag to false.

## Unsupported changes

Currently it is not possible to:
* Add a new browser or browser version (this will be made possible later)
* Add a test for any given feature (should also come later)
* Add any object properties not already defined above
* Modify the **usage\_perc\_y** or **usage\_perc\_a** values (these values are generated)

