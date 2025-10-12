# Style Migration PowerShell Script
# Automates the replacement of hardcoded values with theme constants

param(
    [switch]$DryRun,
    [string]$Path = "mobile/src/components"
)

Write-Host "🚀 Starting Style Migration..." -ForegroundColor Green
Write-Host ""

# Get all component files
$componentFiles = Get-ChildItem -Path $Path -Recurse -Filter "*.tsx" | Where-Object {
    $_.FullName -notmatch "__tests__" -and 
    $_.FullName -notmatch "\.test\." -and
    $_.FullName -notmatch "\.spec\."
}

Write-Host "Found $($componentFiles.Count) component files to process" -ForegroundColor Yellow
Write-Host ""

$stats = @{
    FilesProcessed = 0
    Replacements = 0
    Errors = 0
}

# Migration patterns
$patterns = @{
    backgroundColor = @{
        '#ffffff' = 'COLORS.background.primary'
        '#f8fafc' = 'COLORS.background.secondary'
        '#f3f4f6' = 'COLORS.background.tertiary'
        '#e5e7eb' = 'COLORS.gray[200]'
        '#d1d5db' = 'COLORS.gray[300]'
        '#3b82f6' = 'COLORS.primary.main'
        '#10b981' = 'COLORS.success'
        '#f59e0b' = 'COLORS.warning'
        '#ef4444' = 'COLORS.danger'
    }
    borderRadius = @{
        '50' = 'BORDER_RADIUS.round'
        '20' = 'BORDER_RADIUS.xxl'
        '16' = 'BORDER_RADIUS.lg'
        '12' = 'BORDER_RADIUS.md'
        '8' = 'BORDER_RADIUS.sm'
        '4' = 'BORDER_RADIUS.xs'
    }
    padding = @{
        '24' = 'SPACING.xl'
        '20' = 'SPACING.lg'
        '16' = 'SPACING.md'
        '12' = 'SPACING.sm'
        '8' = 'SPACING.xs'
        '4' = 'SPACING.xxs'
    }
    fontSize = @{
        '28' = 'FONT_SIZE.xxxxl'
        '20' = 'FONT_SIZE.xxl'
        '18' = 'FONT_SIZE.xl'
        '16' = 'FONT_SIZE.lg'
        '14' = 'FONT_SIZE.md'
        '12' = 'FONT_SIZE.sm'
        '10' = 'FONT_SIZE.xs'
    }
    color = @{
        '#1f2937' = 'COLORS.text.primary'
        '#6b7280' = 'COLORS.text.secondary'
        '#9ca3af' = 'COLORS.text.tertiary'
        '#ffffff' = 'COLORS.text.inverse'
    }
}

function Test-UsesThemeConstants {
    param([string]$Content)
    
    return $Content -match "from '\.\./\.\./theme/constants'" -or
           $Content -match "from '\.\./\.\./\.\./theme/constants'" -or
           $Content -match "STYLE_PRESETS" -or
           $Content -match "COLORS\." -or
           $Content -match "SPACING\." -or
           $Content -match "BORDER_RADIUS\." -or
           $Content -match "FONT_SIZE\."
}

function Add-ThemeImports {
    param([string]$Content)
    
    if ($Content -match "from '\.\./\.\./theme/constants'" -or $Content -match "from '\.\./\.\./\.\./theme/constants'") {
        return $Content
    }
    
    $importLines = @(
        "import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZE, FONT_WEIGHT, SHADOWS } from '../../theme/constants';",
        "import { STYLE_PRESETS } from '../../theme/duplicateStyles';"
    )
    
    # Find the last import statement
    $importRegex = [regex]'^import\s+.*?from\s+[''"][^''"]+[''"];?\s*$'
    $imports = [regex]::Matches($Content, $importRegex, [System.Text.RegularExpressions.RegexOptions]::Multiline)
    
    if ($imports.Count -gt 0) {
        $lastImport = $imports[$imports.Count - 1]
        $insertIndex = $lastImport.Index + $lastImport.Length
        return $Content.Substring(0, $insertIndex) + "`n" + ($importLines -join "`n") + "`n" + $Content.Substring($insertIndex)
    } else {
        return ($importLines -join "`n") + "`n`n" + $Content
    }
}

function Invoke-StyleReplacement {
    param([string]$Content, [hashtable]$Patterns, [string]$Property)
    
    $newContent = $Content
    $replacements = 0
    
    foreach ($hardcoded in $Patterns.Keys) {
        $themeValue = $Patterns[$hardcoded]
        
        switch ($Property) {
            'backgroundColor' {
                $regex = [regex]("backgroundColor:\s*['`"]$hardcoded['`"]")
                $matches = $regex.Matches($newContent)
                if ($matches.Count -gt 0) {
                    $newContent = $regex.Replace($newContent, "backgroundColor: $themeValue")
                    $replacements += $matches.Count
                }
            }
            'borderRadius' {
                $regex = [regex]("borderRadius:\s*$hardcoded\b")
                $matches = $regex.Matches($newContent)
                if ($matches.Count -gt 0) {
                    $newContent = $regex.Replace($newContent, "borderRadius: $themeValue")
                    $replacements += $matches.Count
                }
            }
            'padding' {
                $regex = [regex]("padding(?:Horizontal|Vertical)?:\s*$hardcoded\b")
                $matches = $regex.Matches($newContent)
                if ($matches.Count -gt 0) {
                    $newContent = $regex.Replace($newContent, {
                        param($match)
                        $property = $match.Value.Split(':')[0]
                        return "$property`: $themeValue"
                    })
                    $replacements += $matches.Count
                }
            }
            'fontSize' {
                $regex = [regex]("fontSize:\s*$hardcoded\b")
                $matches = $regex.Matches($newContent)
                if ($matches.Count -gt 0) {
                    $newContent = $regex.Replace($newContent, "fontSize: $themeValue")
                    $replacements += $matches.Count
                }
            }
            'color' {
                $regex = [regex]("color:\s*['`"]$hardcoded['`"]")
                $matches = $regex.Matches($newContent)
                if ($matches.Count -gt 0) {
                    $newContent = $regex.Replace($newContent, "color: $themeValue")
                    $replacements += $matches.Count
                }
            }
        }
    }
    
    return @{
        Content = $newContent
        Replacements = $replacements
    }
}

# Process each file
foreach ($file in $componentFiles) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Cyan
    
    try {
        $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
        
        # Skip if already using theme constants
        if (Test-UsesThemeConstants -Content $content) {
            Write-Host "  ✓ Already using theme constants" -ForegroundColor Green
            continue
        }
        
        # Add theme imports
        $newContent = Add-ThemeImports -Content $content
        
        # Replace hardcoded values
        $totalReplacements = 0
        foreach ($property in $patterns.Keys) {
            $result = Invoke-StyleReplacement -Content $newContent -Patterns $patterns[$property] -Property $property
            $newContent = $result.Content
            $totalReplacements += $result.Replacements
        }
        
        if ($totalReplacements -gt 0) {
            if (-not $DryRun) {
                Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
                Write-Host "  ✓ Made $totalReplacements replacements" -ForegroundColor Green
            } else {
                Write-Host "  [DRY RUN] Would make $totalReplacements replacements" -ForegroundColor Yellow
            }
            $stats.FilesProcessed++
            $stats.Replacements += $totalReplacements
        } else {
            Write-Host "  - No hardcoded values found" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  ✗ Error: $($_.Exception.Message)" -ForegroundColor Red
        $stats.Errors++
    }
}

Write-Host ""
Write-Host "📊 Migration Summary:" -ForegroundColor Yellow
Write-Host "Files processed: $($stats.FilesProcessed)" -ForegroundColor White
Write-Host "Total replacements: $($stats.Replacements)" -ForegroundColor White
Write-Host "Errors: $($stats.Errors)" -ForegroundColor White

if ($stats.Errors -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Migration completed with errors. Check the logs above." -ForegroundColor Yellow
}

if ($DryRun) {
    Write-Host ""
    Write-Host "🔍 This was a dry run. No files were modified." -ForegroundColor Blue
    Write-Host "Run without -DryRun to apply changes." -ForegroundColor Blue
}
