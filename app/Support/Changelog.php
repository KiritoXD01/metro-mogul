<?php

namespace App\Support;

use Illuminate\Support\Facades\File;

/**
 * Loads release notes from locale markdown files in resources/changelog/{locale}/*.md
 *
 * Each file uses YAML frontmatter (id, date, title) and ## {icon} Item title sections.
 */
class Changelog
{
    /**
     * @return array<int, array{id: string, date: string, title: string, items: array<int, array{icon: string, title: string, summary: string}>}>
     */
    public static function releases(?string $locale = null): array
    {
        $locale = $locale ?? app()->getLocale();
        $fallback = (string) config('app.fallback_locale', 'en');
        $directory = resource_path('changelog/'.$locale);

        if (! is_dir($directory) && $locale !== $fallback) {
            $directory = resource_path('changelog/'.$fallback);
        }

        if (! is_dir($directory)) {
            return [];
        }

        /** @var array<int, array<string, mixed>> $releases */
        $releases = [];

        foreach (File::files($directory) as $file) {
            if ($file->getExtension() !== 'md') {
                continue;
            }

            $parsed = self::parseFile($file->getPathname());

            if ($parsed !== null) {
                $releases[] = $parsed;
            }
        }

        usort($releases, fn (array $a, array $b): int => strcmp($b['date'], $a['date']));

        return $releases;
    }

    public static function latestId(?string $locale = null): ?string
    {
        $releases = self::releases($locale);

        return $releases[0]['id'] ?? null;
    }

    /**
     * @return array{id: string, date: string, title: string, items: array<int, array{icon: string, title: string, summary: string}>}|null
     */
    public static function parseFile(string $path): ?array
    {
        if (! is_file($path)) {
            return null;
        }

        $content = (string) file_get_contents($path);

        if (! preg_match('/\A---\s*\r?\n(.*?)\r?\n---\s*\r?\n?(.*)\z/s', $content, $matches)) {
            return null;
        }

        /** @var array<string, string> $meta */
        $meta = self::parseFrontmatter($matches[1]);
        $body = trim($matches[2]);

        if (
            ! isset($meta['id'], $meta['date'], $meta['title'])
            || $meta['id'] === ''
            || $meta['date'] === ''
            || $meta['title'] === ''
        ) {
            return null;
        }

        return [
            'id' => $meta['id'],
            'date' => $meta['date'],
            'title' => $meta['title'],
            'items' => self::parseItems($body),
        ];
    }

    /**
     * @return array<string, string>
     */
    private static function parseFrontmatter(string $yaml): array
    {
        $meta = [];

        foreach (preg_split('/\r?\n/', $yaml) as $line) {
            $line = trim($line);

            if ($line === '' || ! str_contains($line, ':')) {
                continue;
            }

            [$key, $value] = array_map('trim', explode(':', $line, 2));
            $value = trim($value, " \t\"'");

            if ($key !== '') {
                $meta[$key] = $value;
            }
        }

        return $meta;
    }

    /**
     * @return array<int, array{icon: string, title: string, summary: string}>
     */
    private static function parseItems(string $body): array
    {
        /** @var array<int, array{icon: string, title: string, summary: string}> $items */
        $items = [];

        if ($body === '') {
            return $items;
        }

        /** @var list<string> $lines */
        $lines = preg_split('/\r?\n/', $body) ?: [];
        $lineCount = count($lines);
        $index = 0;

        while ($index < $lineCount) {
            $line = trim($lines[$index]);

            if (! preg_match('/^##\s+(\S+)\s+(.+)$/u', $line, $match)) {
                $index++;

                continue;
            }

            $index++;
            $summaryLines = [];

            while ($index < $lineCount && ! preg_match('/^##\s/u', trim($lines[$index]))) {
                $chunk = trim($lines[$index]);

                if ($chunk !== '') {
                    $summaryLines[] = $chunk;
                }

                $index++;
            }

            $summary = preg_replace('/\s+/u', ' ', implode(' ', $summaryLines)) ?? '';

            if ($summary === '') {
                continue;
            }

            $items[] = [
                'icon' => $match[1],
                'title' => trim($match[2]),
                'summary' => $summary,
            ];
        }

        return $items;
    }
}
