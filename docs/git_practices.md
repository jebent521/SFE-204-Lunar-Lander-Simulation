# Git Practices

## Commits, Pushing, and Pulling

Do it how you normally do it. Commit to save your work. Have
meaningful commit messages. Push up your changes periodically.
Pull down from origin to avoid conflicts. Not too difficult.

## Branching

I'd like to use branching for this project to (hopefully) make 
things a little cleaner. This isn't something I've used in any of
my other school projects before, so that's why I'm taking the
time to write this little doc for it.

Basically how it works is there'll be a main branch which
contains all the code we know works. Whenever you work on a new
feature of the project, you create a branch off of main, make your
changes, create a pull request, and once it's approved, merge it 
back into main. This should reduce (though it won't eliminate)
the number of merge conflicts we have to deal with.

When you merge your branch, prefer sqaushing or rebasing. Merge
commits are messy and typically add many unhelpful intermediate
commits being added to main - squashing combines everything
into one, and makes the git blame easier to read. Rebasing is
more complex than a merge or squash, but may be clearer to read
than a squash for extremely large PRs. This is most easily done
via GitHub.

After the branch has been merged, remember to delete it - the 
GitHub UI has a convienent button for doing that.

## I'll walk you through a basic example:

Say I'm going to create a new api endpoint on our server that 
allows us to calculate the current velocity of the lander. I would
first create a branch. Note, you should be on branch main before
creating a new branch.

You can create a new branch directly on GitHub or with the
following command:

```bash
git switch -c calculate-velocity-api
```

I make my changes as normal, working on the 
`calculate-velocity-api` branch. Once I'm done, I create a pull 
request, which asks everyone to look at the changes I made and
sign off on them. Once everyone agrees that it's ready to merge,
there will be an option to do so right on GitHub.

The easiest way to create a pull request is through GitHub.
