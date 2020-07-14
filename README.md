# CrUX API tool

The main objective of the tool is to request the data from the API and display it, allowing the user to do multiple calls and view the web vital metrics.

* [https://core-web-vitals.now.sh/](https://core-web-vitals.now.sh/) - CrUX API tool

## Getting Started

Search for an origin and the tool will fetch from the API and then build a card with the web vitals for its origin with all available form factors. If the are no metrics for a form factor (ex: "phone" ) then the tab will return "no data". If the origin has no metrics found in the API then no card will be created. 

```
www.example.com
```

NOTE: some origins "www" will return no data, therefor you can add the origin as follow:

```
example.com
```

## Deployment

The deployment of this tool is using vercel.
* [Vercel](https://vercel.com/) - Used to host the tool

## Built With

* [Crux API](https://web.dev/chrome-ux-report-api/) - Dependency for the crux tool
* [MaterializeCSS](https://maven.apache.org/) - The web framework used
* [Vercel](https://vercel.com/) - Used to host the tool


## Authors

* **Alejandro Loaiza**

See also the list of [contributors](https://github.com/zer0kool/core-web-vitals/graphs/contributors) who participated in this project.

## Acknowledgments

* The tool was built from a code sample, if you would like to learn more about the example please read this article: [Crux API](https://web.dev/chrome-ux-report-api/)