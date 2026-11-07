# Pushing Perokio to GitHub

## Option 1: From the git bundle (recommended)

```bash
# 1. Download perokio-v1.git.bundle
# 2. Clone it:
git clone perokio-v1.git.bundle perokio
cd perokio

# 3. Create a new repo on GitHub (via web or gh CLI):
gh repo create perokio --public --source=. --push
# OR manually create on github.com, then:
git remote add origin git@github.com:YOUR_USERNAME/perokio.git
git push -u origin main

# 4. Install dependencies and run:
bun install
bun run dev
```

## Option 2: From the tarball

```bash
# 1. Download perokio-full-project.tar.gz
# 2. Extract:
tar -xzf perokio-full-project.tar.gz
cd perokio

# 3. Initialize git:
git init
git add .
git commit -m "Perokio V1"

# 4. Create repo on GitHub and push:
gh repo create perokio --public --source=. --push
# OR:
git remote add origin git@github.com:YOUR_USERNAME/perokio.git
git push -u origin main

# 5. Install and run:
bun install
bun run dev
```

## What's included

- 233+ tracked files (all source code, configs, screenshots)
- Full commit history (Cycles 1-8)
- No node_modules (run `bun install` to regenerate)
- No .next build cache (run `bun run dev` to create)
