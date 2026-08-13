# GitHub Streak Stats

This repo generates a local SVG stats card for a GitHub profile README.

The one I previously had that I found online kept on glitching and whatever, and it's kind of annoying so I'm gonna try to make my own.

![GitHub streak stats](assets/github-streak-stats.svg)

![GitHub streak stats dark](assets/github-streak-stats-dark.svg)

![GitHub streak stats green](assets/github-streak-stats-green.svg)

![GitHub streak stats green dark](assets/github-streak-stats-green-dark.svg)

![GitHub streak stats blue](assets/github-streak-stats-blue.svg)

![GitHub streak stats blue dark](assets/github-streak-stats-blue-dark.svg)

![GitHub streak stats purple](assets/github-streak-stats-purple.svg)

![GitHub streak stats purple dark](assets/github-streak-stats-purple-dark.svg)

## Use In Your Profile README

Add this to your profile README:

```md
![GitHub streak stats](https://raw.githubusercontent.com/kamillamamatova/streak-stats/master/assets/github-streak-stats.svg)
```

Dark mode version:

```md
![GitHub streak stats dark](https://raw.githubusercontent.com/kamillamamatova/streak-stats/master/assets/github-streak-stats-dark.svg)
```

Other color versions:

```md
![GitHub streak stats green](https://raw.githubusercontent.com/kamillamamatova/streak-stats/master/assets/github-streak-stats-green.svg)
![GitHub streak stats green dark](https://raw.githubusercontent.com/kamillamamatova/streak-stats/master/assets/github-streak-stats-green-dark.svg)
![GitHub streak stats blue](https://raw.githubusercontent.com/kamillamamatova/streak-stats/master/assets/github-streak-stats-blue.svg)
![GitHub streak stats blue dark](https://raw.githubusercontent.com/kamillamamatova/streak-stats/master/assets/github-streak-stats-blue-dark.svg)
![GitHub streak stats purple](https://raw.githubusercontent.com/kamillamamatova/streak-stats/master/assets/github-streak-stats-purple.svg)
![GitHub streak stats purple dark](https://raw.githubusercontent.com/kamillamamatova/streak-stats/master/assets/github-streak-stats-purple-dark.svg)
```

If your remote repository uses `main` instead of `master`, replace `master` in the URL with `main`.

## Private Contributions

To include private contributions:

1. On GitHub, open your profile.
2. Above the contribution calendar, open `Contribution settings`.
3. Turn on `Private contributions`.
4. In this repository, add an Actions secret named `STATS_TOKEN`.

The secret should be a GitHub token for your account. The default `GITHUB_TOKEN` can update the SVG, but it usually cannot see your private contribution history as you.

## Run Locally

```sh
STATS_TOKEN=your_github_token npm run generate
```
