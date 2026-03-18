---
name: semrush-cli
description: SEMrush keyword research, domain analytics, backlinks, and competitive intelligence via the local semrush CLI tool
argument-hint: [keyword, domain, or command]
disable-model-invocation: true
allowed-tools:
  - Bash
  - Read
---

# SEMrush CLI (Local)

Fast keyword research, domain analytics, backlinks, traffic analysis, and competitive intelligence using the locally installed `semrush` CLI. This CLI is built from the unified semrush-mcp repo and shares the same API client as the MCP server.

## Arguments

$ARGUMENTS

- A keyword, domain, or command to run (e.g., "seo tools", "example.com", "kw seo --related")
- If blank, will prompt for a target

## Prerequisites

The CLI is installed globally from the semrush-mcp repo. Verify it's available:

```bash
semrush --version
```

Ensure `SEMRUSH_API_KEY` is set in your environment or `.env` file.

## Available Commands

### 1. Quick Overview
Auto-detects whether the target is a keyword or domain and returns the appropriate overview.

```bash
semrush q "seo tools"           # Keyword overview
semrush q example.com           # Domain overview
semrush quick "content marketing" -d uk  # Specify database
```

Options:
- `-d, --database <db>`: Country database code (default: us)
- `-f, --format <fmt>`: Output format — text or json (default: text)

### 2. Keyword Research
In-depth keyword analysis with multiple sub-commands.

```bash
# Basic keyword overview
semrush kw "content marketing"

# Related keywords
semrush kw "seo" --related -l 20

# Question-based keywords
semrush kw "marketing" --questions -l 10

# Broad match keywords
semrush kw "email marketing" --broad -l 15

# SERP organic results (who ranks for this keyword)
semrush kw "seo tools" --organic -l 10

# SERP paid results
semrush kw "ppc software" --paid -l 10
```

Options:
- `--related`: Get related keywords
- `--questions`: Get question-based keyword variations
- `--broad`: Get broad match keywords
- `--organic`: Get organic SERP results for the keyword
- `--paid`: Get paid SERP results for the keyword
- `-d, --database <db>`: Country database code (default: us)
- `-l, --limit <n>`: Number of results to return
- `-f, --format <fmt>`: Output format — text or json (default: text)

### 3. Batch Keyword Difficulty
Analyze difficulty scores for multiple keywords at once.

```bash
semrush kd "seo" "content marketing" "link building"
semrush kd "keyword1" "keyword2" "keyword3" -d uk
```

Options:
- `-d, --database <db>`: Country database code (default: us)
- `-f, --format <fmt>`: Output format — text or json (default: text)

### 4. Domain Analytics
Comprehensive domain analysis with multiple views.

```bash
# Domain overview
semrush d semrush.com
semrush domain example.com

# Organic keywords the domain ranks for
semrush d example.com --organic -l 30

# Paid keywords the domain bids on
semrush d example.com --paid -l 20

# Organic search competitors
semrush d example.com --competitors -l 10
```

Options:
- `--organic`: Get organic keywords for the domain
- `--paid`: Get paid keywords for the domain
- `--competitors`: Get organic search competitors
- `-d, --database <db>`: Country database code (default: us)
- `-l, --limit <n>`: Number of results to return
- `-f, --format <fmt>`: Output format — text or json (default: text)

### 5. Backlinks
Backlink analysis for domains and URLs.

```bash
# Backlink overview
semrush bl example.com
semrush backlinks example.com

# Referring domains
semrush bl example.com --domains -l 20
```

Options:
- `--domains`: Get referring domains instead of individual backlinks
- `-l, --limit <n>`: Number of results to return
- `-f, --format <fmt>`: Output format — text or json (default: text)

### 6. Traffic Analytics
Traffic data for domains (requires .Trends subscription).

```bash
# Traffic summary
semrush traffic example.com

# Traffic sources breakdown
semrush traffic example.com --sources
```

Options:
- `--sources`: Get traffic sources breakdown
- `--country <code>`: Country filter (default: us)
- `-f, --format <fmt>`: Output format — text or json (default: text)

### 7. Keyword Gap Analysis
Find keyword opportunities by comparing two domains.

```bash
semrush gaps mysite.com competitor.com -l 50
semrush gaps mysite.com competitor.com -d uk -l 30
```

Options:
- `-d, --database <db>`: Country database code (default: us)
- `-l, --limit <n>`: Number of results to return
- `-f, --format <fmt>`: Output format — text or json (default: text)

### 8. API Units Balance
Check remaining API units on your account.

```bash
semrush units
```

## Process

### Step 1: Understand the request

Determine what kind of research the user wants:
- **Quick lookup**: Use `semrush q` for fast overview of a keyword or domain
- **Keyword deep-dive**: Use `semrush kw` with appropriate flags
- **Domain analysis**: Use `semrush d` with appropriate flags
- **Competitive intel**: Use `semrush d --competitors` or `semrush gaps`
- **Backlink audit**: Use `semrush bl`
- **Traffic check**: Use `semrush traffic`

### Step 2: Run the appropriate command

Based on $ARGUMENTS, construct and execute the right command. Always use `-f text` for human-readable output unless the user specifically wants JSON.

### Step 3: Present findings

Summarize results clearly:

**Overview:** Brief summary of key metrics

**Key Data Points:**
- Volume, difficulty, CPC for keywords
- Traffic, keyword count, competitors for domains
- Authority, referring domains for backlinks

**Insights:** Actionable observations based on the data

## Global Options

All commands support these flags:
- `-d, --database <db>`: Country/database code (default: us). Codes: us, uk, ca, au, de, fr, es, it, br, mx, in, jp, etc.
- `-l, --limit <n>`: Number of results to return
- `-f, --format <fmt>`: Output format — text (colorized tables) or json (raw data, pipe to jq)

## Example Usage

### Research a keyword and its competition
```bash
semrush kw "project management software" --related -l 20
semrush kw "project management software" --organic -l 10
semrush kd "project management" "task management" "team collaboration"
```

### Audit a competitor domain
```bash
semrush d competitor.com
semrush d competitor.com --organic -l 50
semrush d competitor.com --competitors -l 10
semrush bl competitor.com --domains -l 20
```

### Find keyword gaps
```bash
semrush gaps mysite.com competitor.com -l 100
```

### Quick lookups
```bash
semrush q "best crm software"
semrush q hubspot.com
semrush units
```

## API Units

Different API calls consume different amounts of units per line returned:

| Operation | Units/Line |
|-----------|-----------|
| Keyword overview | 10 |
| Batch keyword overview | 10 |
| Keyword organic results | 10 |
| Keyword paid results | 20 |
| Related keywords | 40 |
| Keyword ads history | 100 |
| Broad match keywords | 20 |
| Phrase questions | 40 |
| Keyword difficulty | 50 |

Check your balance anytime with `semrush units`.
