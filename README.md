# Codeforces Visualizer

This is code repository for a simple analytics visualization site for [Codeforces online judge](http://codeforces.com/) users using [Codeforeces API](http://codeforces.com/api/help). The site is currently hosted at [here](http://cfviz.netlify.com/).

### Current features

#### Single User Analytics
* Verdicts chart
* Languages chart
* Tags chart
* Levels chart
* Total tried problems count
* Total solved problems count
* Average and max attempts
* Count of problems solved with one submission
* Max AC for a single problem (It indicates in how many ways someone solved a problem)
* List of unsolved problems

#### Comparison between two users
* Current, max and min rating
* Number of contests
* Best and worst position in contest
* Max positive and negative rating change
* Compared rating time-line
* Total tried problem count compared
* Total solved problem count compared
* Average and max attempts compared
* Count of problems solved with one submission compared
* Max AC for a single problem compared
* Tags compared
* Levels compared


#### Issues
* When somebody searches for a handle that doesn't exists, we get  Cross-Origin Request blocked and the status code becomes 0 in jQuery. So we can't determine if the user doesn't really exists or some other network problem occurs.
* Firefox hangs for a while when drawing the tags comparison chart. Probably because it's big. I have plan to divide that chart in two parts.
