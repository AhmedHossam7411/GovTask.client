import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';

export interface RiskPattern {
  regex: RegExp;
  label: string;
  category: 'SQL Injection' | 'XSS' | 'Path Traversal' | 'Attack Tools' | 'Command Injection' | 'SSTI' | 'XXE' | 'Custom';
  removable: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BehaviorTrackerService {
  public snapshotComplete$ = new Subject<any>();
  private lastClickTime: number | null = null;
  private mouseDownTime: number | null = null;

  private clickIntervals: number[] = [];
  private clickDurations: number[] = [];
  private preClickSpeeds: number[] = [];

  private lastMouseMoveTime: number | null = null;
  private lastMousePosition: { x: number; y: number } | null = null;
  private mouseSpeeds: number[] = [];
  private mouseIdleTimes: number[] = [];

  private keyDownTimestamps = new Map<string, number>();
  private keyDwellTimes: number[] = [];
  private keyFlightTimes: number[] = [];
  private lastKeyDownTime: number | null = null;
  private keystrokeBuffer: string = '';
  private readonly MAX_BUFFER_SIZE = 100;
  private readonly ABNORMAL_INPUT_THRESHOLD = 500;
  private detectedPatterns: string[] = [];

  
  private pasteCount = 0;
  private suspiciousPasteDetected = false;
  private devToolsShortcutCount = 0;
  private abnormalInputDetected = false;
  private unauthorizedAttempts = 0;

  private riskPatterns: RiskPattern[] = [

    // SQL Injection
    { regex: /UNION\s+SELECT/i,          label: 'UNION SELECT',        category: 'SQL Injection', removable: false },
    { regex: /UNION\s+ALL\s+SELECT/i,    label: 'UNION ALL SELECT',    category: 'SQL Injection', removable: false },
    { regex: /SELECT\s+.+\s+FROM/i,      label: 'SELECT...FROM',       category: 'SQL Injection', removable: false },
    { regex: /OR\s+1\s*=\s*1/i,          label: 'OR 1=1',              category: 'SQL Injection', removable: false },
    { regex: /AND\s+1\s*=\s*[12]/i,      label: 'AND 1=1/1=2',        category: 'SQL Injection', removable: false },
    { regex: /'--/,                       label: "'--",                 category: 'SQL Injection', removable: false },
    { regex: /DROP\s+TABLE/i,             label: 'DROP TABLE',          category: 'SQL Injection', removable: false },
    { regex: /TRUNCATE\s+TABLE/i,         label: 'TRUNCATE TABLE',      category: 'SQL Injection', removable: false },
    { regex: /DELETE\s+FROM\s+\w+/i,      label: 'DELETE FROM',         category: 'SQL Injection', removable: false },
    { regex: /INSERT\s+INTO\s+\w+/i,      label: 'INSERT INTO',         category: 'SQL Injection', removable: false },
    { regex: /INFORMATION_SCHEMA/i,       label: 'INFORMATION_SCHEMA',  category: 'SQL Injection', removable: false },
    { regex: /EXEC\s*\(/i,                label: 'EXEC(',               category: 'SQL Injection', removable: false },
    { regex: /xp_cmdshell/i,              label: 'xp_cmdshell',         category: 'SQL Injection', removable: false },
    { regex: /xp_dirtree/i,               label: 'xp_dirtree',          category: 'SQL Injection', removable: false },
    { regex: /WAITFOR\s+DELAY/i,          label: 'WAITFOR DELAY',       category: 'SQL Injection', removable: false },
    { regex: /SLEEP\s*\(\d/i,             label: 'SLEEP(',              category: 'SQL Injection', removable: false },
    { regex: /BENCHMARK\s*\(/i,           label: 'BENCHMARK(',          category: 'SQL Injection', removable: false },
    { regex: /INTO\s+OUTFILE/i,           label: 'INTO OUTFILE',        category: 'SQL Injection', removable: false },
    { regex: /LOAD_FILE\s*\(/i,           label: 'LOAD_FILE(',          category: 'SQL Injection', removable: false },
    { regex: /CASE\s+WHEN\s+\d/i,         label: 'CASE WHEN (blind)',   category: 'SQL Injection', removable: false },
    { regex: /ASCII\s*\(\s*SUBSTRING/i,   label: 'ASCII(SUBSTRING)',    category: 'SQL Injection', removable: false },
    { regex: /CHAR\s*\(\d+\)/i,           label: 'CHAR(n) bypass',      category: 'SQL Injection', removable: false },

    // XSS - HTML injection tags
    { regex: /<script/i,                        label: '<script>',                category: 'XSS', removable: false },
    { regex: /<\/script>/i,                     label: '</script>',               category: 'XSS', removable: false },
    { regex: /<iframe/i,                        label: '<iframe>',                category: 'XSS', removable: false },
    { regex: /<object/i,                        label: '<object>',                category: 'XSS', removable: false },
    { regex: /<embed/i,                         label: '<embed>',                 category: 'XSS', removable: false },
    { regex: /<applet/i,                        label: '<applet>',                category: 'XSS', removable: false },
    { regex: /<plaintext>/i,                    label: '<plaintext>',             category: 'XSS', removable: false },
    { regex: /<marquee/i,                       label: '<marquee>',               category: 'XSS', removable: false },
    { regex: /<math/i,                          label: '<math> MathML',           category: 'XSS', removable: false },
    { regex: /<body[^>]*onload/i,               label: '<body onload>',           category: 'XSS', removable: false },
    { regex: /<details[^>]*ontoggle/i,          label: '<details ontoggle>',      category: 'XSS', removable: false },
    { regex: /<input[^>]*autofocus[^>]*onfocus/i, label: '<input autofocus onfocus>', category: 'XSS', removable: false },
    { regex: /<video[^>]*(onerror|onload|src)/i,label: '<video src/event>',       category: 'XSS', removable: false },
    { regex: /<audio[^>]*(onerror|onload)/i,    label: '<audio onerror>',         category: 'XSS', removable: false },
    { regex: /<source[^>]*onerror/i,            label: '<source onerror>',        category: 'XSS', removable: false },
    { regex: /<img[^>]*onerror/i,               label: '<img onerror>',           category: 'XSS', removable: false },
    { regex: /<img[^>]*src\s*=\s*["']?\s*x/i,  label: '<img src=x>',             category: 'XSS', removable: false },
    { regex: /<svg[^>]*(onload|onerror)/i,      label: '<svg onload>',            category: 'XSS', removable: false },
    { regex: /<svg[^>]*\/>/i,                   label: '<svg/> self-close',       category: 'XSS', removable: false },
    { regex: /<\/textarea>[^<]*<script/i,       label: '</textarea><script>',     category: 'XSS', removable: false },
    { regex: /<\/title>[^<]*<script/i,          label: '</title><script>',        category: 'XSS', removable: false },
    { regex: /<noscript>/i,                     label: '<noscript>',              category: 'XSS', removable: false },
    { regex: /<noframes>/i,                     label: '<noframes>',              category: 'XSS', removable: false },
    { regex: /<isindex/i,                       label: '<isindex>',               category: 'XSS', removable: false },
    { regex: /<link[^>]*href[^>]*javascript/i,  label: '<link href=javascript:>', category: 'XSS', removable: false },
    { regex: /<form[^>]*action[^>]*javascript/i,label: '<form action=javascript:>',category: 'XSS', removable: false },

    // XSS - event handlers
    { regex: /onerror\s*=/i,                    label: 'onerror=',                category: 'XSS', removable: false },
    { regex: /onload\s*=/i,                     label: 'onload=',                 category: 'XSS', removable: false },
    { regex: /onfocus\s*=/i,                    label: 'onfocus=',                category: 'XSS', removable: false },
    { regex: /onblur\s*=/i,                     label: 'onblur=',                 category: 'XSS', removable: false },
    { regex: /ontoggle\s*=/i,                   label: 'ontoggle=',               category: 'XSS', removable: false },
    { regex: /onmouseover\s*=/i,                label: 'onmouseover=',            category: 'XSS', removable: false },
    { regex: /onmouseenter\s*=/i,               label: 'onmouseenter=',           category: 'XSS', removable: false },
    { regex: /onmouseleave\s*=/i,               label: 'onmouseleave=',           category: 'XSS', removable: false },
    { regex: /onmousedown\s*=/i,                label: 'onmousedown=',            category: 'XSS', removable: false },
    { regex: /onmouseup\s*=/i,                  label: 'onmouseup=',              category: 'XSS', removable: false },
    { regex: /onclick\s*=/i,                    label: 'onclick=',                category: 'XSS', removable: false },
    { regex: /ondblclick\s*=/i,                 label: 'ondblclick=',             category: 'XSS', removable: false },
    { regex: /oncontextmenu\s*=/i,              label: 'oncontextmenu=',          category: 'XSS', removable: false },
    { regex: /onkeydown\s*=/i,                  label: 'onkeydown=',              category: 'XSS', removable: false },
    { regex: /onkeyup\s*=/i,                    label: 'onkeyup=',                category: 'XSS', removable: false },
    { regex: /onkeypress\s*=/i,                 label: 'onkeypress=',             category: 'XSS', removable: false },
    { regex: /onchange\s*=/i,                   label: 'onchange=',               category: 'XSS', removable: false },
    { regex: /oninput\s*=/i,                    label: 'oninput=',                category: 'XSS', removable: false },
    { regex: /onsubmit\s*=/i,                   label: 'onsubmit=',               category: 'XSS', removable: false },
    { regex: /onreset\s*=/i,                    label: 'onreset=',                category: 'XSS', removable: false },
    { regex: /oninvalid\s*=/i,                  label: 'oninvalid=',              category: 'XSS', removable: false },
    { regex: /onscroll\s*=/i,                   label: 'onscroll=',               category: 'XSS', removable: false },
    { regex: /onwheel\s*=/i,                    label: 'onwheel=',                category: 'XSS', removable: false },
    { regex: /ondrop\s*=/i,                     label: 'ondrop=',                 category: 'XSS', removable: false },
    { regex: /ondragstart\s*=/i,                label: 'ondragstart=',            category: 'XSS', removable: false },
    { regex: /onplay\s*=/i,                     label: 'onplay=',                 category: 'XSS', removable: false },
    { regex: /onpause\s*=/i,                    label: 'onpause=',                category: 'XSS', removable: false },
    { regex: /onended\s*=/i,                    label: 'onended=',                category: 'XSS', removable: false },
    { regex: /onanimationstart\s*=/i,           label: 'onanimationstart=',       category: 'XSS', removable: false },
    { regex: /ontransitionend\s*=/i,            label: 'ontransitionend=',        category: 'XSS', removable: false },
    { regex: /onpropertychange\s*=/i,           label: 'onpropertychange=',       category: 'XSS', removable: false },
    { regex: /onbeforeunload\s*=/i,             label: 'onbeforeunload=',         category: 'XSS', removable: false },
    { regex: /onhashchange\s*=/i,               label: 'onhashchange=',           category: 'XSS', removable: false },
    { regex: /onmessage\s*=/i,                  label: 'onmessage=',              category: 'XSS', removable: false },
    { regex: /onpointerdown\s*=/i,              label: 'onpointerdown=',          category: 'XSS', removable: false },
    { regex: /onpointerover\s*=/i,              label: 'onpointerover=',          category: 'XSS', removable: false },

    // XSS - protocol and URI schemes
    { regex: /javascript:/i,                    label: 'javascript:',             category: 'XSS', removable: false },
    { regex: /vbscript:/i,                      label: 'vbscript:',               category: 'XSS', removable: false },
    { regex: /livescript:/i,                    label: 'livescript:',             category: 'XSS', removable: false },
    { regex: /data:text\/html/i,                label: 'data:text/html',          category: 'XSS', removable: false },
    { regex: /data:application\/javascript/i,   label: 'data:application/js',     category: 'XSS', removable: false },
    { regex: /data:,<script/i,                  label: 'data:,<script>',          category: 'XSS', removable: false },
    { regex: /data:[^,]*base64/i,               label: 'data:base64',             category: 'XSS', removable: false },

    // XSS - DOM sinks
    { regex: /eval\s*\(/i,                      label: 'eval(',                   category: 'XSS', removable: false },
    { regex: /Function\s*\(/i,                  label: 'Function( constructor',   category: 'XSS', removable: false },
    { regex: /setTimeout\s*\(\s*["'`]/i,        label: 'setTimeout(string)',      category: 'XSS', removable: false },
    { regex: /setInterval\s*\(\s*["'`]/i,       label: 'setInterval(string)',     category: 'XSS', removable: false },
    { regex: /innerHTML\s*=/i,                  label: 'innerHTML=',              category: 'XSS', removable: false },
    { regex: /outerHTML\s*=/i,                  label: 'outerHTML=',              category: 'XSS', removable: false },
    { regex: /insertAdjacentHTML\s*\(/i,        label: 'insertAdjacentHTML(',     category: 'XSS', removable: false },
    { regex: /document\.write\s*\(/i,           label: 'document.write()',        category: 'XSS', removable: false },
    { regex: /document\.writeln\s*\(/i,         label: 'document.writeln()',      category: 'XSS', removable: false },
    { regex: /document\.cookie/i,               label: 'document.cookie',         category: 'XSS', removable: false },
    { regex: /document\.location/i,             label: 'document.location',       category: 'XSS', removable: false },
    { regex: /document\.domain/i,               label: 'document.domain',         category: 'XSS', removable: false },
    { regex: /document\.referrer/i,             label: 'document.referrer',       category: 'XSS', removable: false },
    { regex: /document\.createElement/i,        label: 'document.createElement',  category: 'XSS', removable: false },
    { regex: /document\.body\.innerHTML/i,      label: 'document.body.innerHTML', category: 'XSS', removable: false },
    { regex: /window\.location\s*=/i,           label: 'window.location=',        category: 'XSS', removable: false },
    { regex: /location\.href\s*=/i,             label: 'location.href=',          category: 'XSS', removable: false },
    { regex: /location\.replace\s*\(/i,         label: 'location.replace(',       category: 'XSS', removable: false },
    { regex: /location\.assign\s*\(/i,          label: 'location.assign(',        category: 'XSS', removable: false },
    { regex: /window\.name/i,                   label: 'window.name',             category: 'XSS', removable: false },
    { regex: /window\.open\s*\(/i,              label: 'window.open(',            category: 'XSS', removable: false },
    { regex: /postMessage\s*\(/i,               label: 'postMessage(',            category: 'XSS', removable: false },
    { regex: /fetch\s*\(\s*["'`]https?:\/\//i,  label: 'fetch(url)',              category: 'XSS', removable: false },
    { regex: /XMLHttpRequest/i,                 label: 'XMLHttpRequest',          category: 'XSS', removable: false },
    { regex: /navigator\.sendBeacon\s*\(/i,     label: 'navigator.sendBeacon(',   category: 'XSS', removable: false },
    { regex: /localStorage\.setItem\s*\(/i,     label: 'localStorage.setItem(',   category: 'XSS', removable: false },
    { regex: /sessionStorage\.setItem\s*\(/i,   label: 'sessionStorage.setItem(', category: 'XSS', removable: false },

    // XSS - JS execution and obfuscation
    { regex: /alert\s*\(/i,                     label: 'alert(',                  category: 'XSS', removable: false },
    { regex: /confirm\s*\(/i,                   label: 'confirm(',                category: 'XSS', removable: false },
    { regex: /prompt\s*\(/i,                    label: 'prompt(',                 category: 'XSS', removable: false },
    { regex: /String\.fromCharCode/i,           label: 'String.fromCharCode',     category: 'XSS', removable: false },
    { regex: /atob\s*\(/i,                      label: 'atob( base64 decode',     category: 'XSS', removable: false },
    { regex: /btoa\s*\(/i,                      label: 'btoa( base64 encode',     category: 'XSS', removable: false },
    { regex: /unescape\s*\(/i,                  label: 'unescape(',               category: 'XSS', removable: false },
    { regex: /decodeURIComponent\s*\(/i,        label: 'decodeURIComponent(',     category: 'XSS', removable: false },
    { regex: /globalThis\s*\[/i,                label: 'globalThis[',             category: 'XSS', removable: false },
    { regex: /\bself\s*\[\s*["'`]eval/i,        label: "self['eval']",            category: 'XSS', removable: false },
    { regex: /\btop\s*\[\s*["'`]eval/i,         label: "top['eval']",             category: 'XSS', removable: false },
    { regex: /parent\s*\.\s*eval/i,             label: 'parent.eval',             category: 'XSS', removable: false },
    { regex: /Function\.prototype/i,            label: 'Function.prototype',      category: 'XSS', removable: false },
    { regex: /\\u003c/i,                        label: '\\u003c unicode <',       category: 'XSS', removable: false },
    { regex: /&#x3c;/i,                         label: '&#x3c; HTML entity <',    category: 'XSS', removable: false },
    { regex: /&#60;/i,                          label: '&#60; HTML entity <',     category: 'XSS', removable: false },
    { regex: /%3Cscript/i,                      label: '%3Cscript URL-encoded',   category: 'XSS', removable: false },
    { regex: /expression\s*\(/i,                label: 'expression( CSS eval',    category: 'XSS', removable: false },
    { regex: /-moz-binding/i,                   label: '-moz-binding CSS XSS',    category: 'XSS', removable: false },
    { regex: /behavior\s*:\s*url\s*\(/i,        label: 'behavior:url( CSS XSS',   category: 'XSS', removable: false },

    // Command Injection
    { regex: /;\s*(cat|ls|id|whoami|uname|pwd|ifconfig|ipconfig)\b/i, label: '; unix-cmd',    category: 'Command Injection', removable: false },
    { regex: /\|\s*(cat|ls|id|whoami|curl|wget|bash|sh)\b/i,          label: '| pipe-cmd',   category: 'Command Injection', removable: false },
    { regex: /\$\s*\(\s*(cat|ls|id|whoami|uname)/i,                   label: '$(cmd-subst)', category: 'Command Injection', removable: false },
    { regex: /\/bin\/(sh|bash|zsh|dash)/i,                            label: '/bin/sh',      category: 'Command Injection', removable: false },
    { regex: /curl\s+https?:\/\//i,                                   label: 'curl http',    category: 'Command Injection', removable: false },
    { regex: /wget\s+https?:\/\//i,                                   label: 'wget http',    category: 'Command Injection', removable: false },
    { regex: /bash\s+-i\s*>/i,                                        label: 'bash -i >',    category: 'Command Injection', removable: false },
    { regex: /\bnc\s+-[el]/i,                                         label: 'netcat -e/-l', category: 'Command Injection', removable: false },
    { regex: /python\s+-c\s+['"]/i,                                   label: 'python -c',    category: 'Command Injection', removable: false },
    { regex: /powershell\s+-/i,                                       label: 'powershell -', category: 'Command Injection', removable: false },
    { regex: /cmd\s*\/c\s+/i,                                         label: 'cmd /c',       category: 'Command Injection', removable: false },
    { regex: /cat\s+\/etc\//i,                                        label: 'cat /etc/',    category: 'Command Injection', removable: false },

    // SSTI
    { regex: /\{\{[\s\S]*?\}\}/,  label: '{{...}} Jinja2/Twig',  category: 'SSTI', removable: false },
    { regex: /\$\{[^}]+\}/,       label: '${...} Java EL',       category: 'SSTI', removable: false },
    { regex: /<%=[\s\S]*?%>/,     label: '<%= %> ERB/JSP',       category: 'SSTI', removable: false },
    { regex: /#\{[^}]+\}/,        label: '#{...} Thymeleaf',     category: 'SSTI', removable: false },

    // Path Traversal
    { regex: /\.\.\//,             label: '../',                  category: 'Path Traversal', removable: false },
    { regex: /\.\.\\\\/,           label: '..\\',                 category: 'Path Traversal', removable: false },
    { regex: /\.\.\.\.\//,         label: '..../ (bypass)',       category: 'Path Traversal', removable: false },
    { regex: /%2e%2e/i,            label: '%2e%2e (encoded ../)', category: 'Path Traversal', removable: false },
    { regex: /%252e%252e/i,        label: '%252e (double-enc)',   category: 'Path Traversal', removable: false },
    { regex: /\/etc\/passwd/i,     label: '/etc/passwd',          category: 'Path Traversal', removable: false },
    { regex: /\/proc\/self/i,      label: '/proc/self',           category: 'Path Traversal', removable: false },
    { regex: /\/etc\/shadow/i,     label: '/etc/shadow',          category: 'Path Traversal', removable: false },
    { regex: /boot\.ini/i,         label: 'boot.ini',             category: 'Path Traversal', removable: false },
    { regex: /win\.ini/i,          label: 'win.ini',              category: 'Path Traversal', removable: false },
    { regex: /\/windows\/system32/i, label: '/windows/system32', category: 'Path Traversal', removable: false },
    { regex: /\.env\b/i,           label: '.env',                 category: 'Path Traversal', removable: false },
    { regex: /config\.json/i,      label: 'config.json',          category: 'Path Traversal', removable: false },
    { regex: /config\.php/i,       label: 'config.php',           category: 'Path Traversal', removable: false },
    { regex: /\/\.git\//,          label: '/.git/',               category: 'Path Traversal', removable: false },
    { regex: /file:\/\/\//i,       label: 'file:/// protocol',    category: 'Path Traversal', removable: false },
    { regex: /%00/,                label: '%00 null byte',        category: 'Path Traversal', removable: false },
    { regex: /\/etc\/hosts/i,      label: '/etc/hosts',           category: 'Path Traversal', removable: false },
    { regex: /\/etc\/shadow/i,     label: '/etc/shadow',          category: 'Path Traversal', removable: false },

    // Command Injection - additional patterns
    // Shellshock (CVE-2014-6271): bash env-variable code execution
    { regex: /\(\)\s*\{\s*[^}]*;\s*/,                    label: 'Shellshock () {',        category: 'Command Injection', removable: false },
    // Backtick shell execution: `ls -al /`
    { regex: /`[^`]+[\/\|;]/,                            label: 'backtick execution',     category: 'Command Injection', removable: false },
    // Ruby/Perl system calls
    { regex: /Kernel\.(exec|exit|system)\s*\(/i,         label: 'Kernel.exec/system',     category: 'Command Injection', removable: false },
    { regex: /\bSystem\s*\(\s*["']/i,                    label: 'System() call',          category: 'Command Injection', removable: false },
    { regex: /%x\s*[\([']/i,                             label: '%x() Ruby shell',        category: 'Command Injection', removable: false },
    { regex: /@\{\s*\[system\s/i,                        label: '@{[system]} Perl',       category: 'Command Injection', removable: false },
    // Environment variable injection
    { regex: /\$(?:HOME|USER|PATH|SHELL|IFS)\b/,         label: '$HOME/$USER env var',    category: 'Command Injection', removable: false },
    { regex: /\$ENV\s*\{/i,                              label: '$ENV{} interpolation',   category: 'Command Injection', removable: false },
    // Format string attacks — multiple consecutive specifiers signal a probe
    { regex: /(%[sdnxp]){2,}/i,                          label: 'format string %s%n',     category: 'Command Injection', removable: false },

    // XXE
    { regex: /<!DOCTYPE[^>]*\[/i,                        label: '<!DOCTYPE [...]>',       category: 'XXE', removable: false },
    { regex: /<!ENTITY\s+\w/i,                           label: '<!ENTITY>',              category: 'XXE', removable: false },
    { regex: /SYSTEM\s+["']file:/i,                      label: 'XXE SYSTEM file://',     category: 'XXE', removable: false },
    { regex: /&xxe;/i,                                   label: '&xxe; entity ref',       category: 'XXE', removable: false },

    // Attack Tools
    { regex: /phpinfo\s*\(\)/i,    label: 'phpinfo()',            category: 'Attack Tools', removable: false },
    { regex: /admin\.php/i,        label: 'admin.php',            category: 'Attack Tools', removable: false },
    { regex: /wp-admin/i,          label: 'wp-admin',             category: 'Attack Tools', removable: false },
    { regex: /shell\.php/i,        label: 'shell.php',            category: 'Attack Tools', removable: false },
    { regex: /cmd\.exe/i,          label: 'cmd.exe',              category: 'Attack Tools', removable: false },
    { regex: /sqlmap/i,            label: 'sqlmap',               category: 'Attack Tools', removable: false },
    { regex: /metasploit/i,        label: 'metasploit',           category: 'Attack Tools', removable: false },
    { regex: /msfvenom/i,          label: 'msfvenom',             category: 'Attack Tools', removable: false },
    { regex: /nikto/i,             label: 'nikto',                category: 'Attack Tools', removable: false },
  ];

  public urgentAnomalyDetected$ = new Subject<{ reason: string; detectedUrl: string }>();

  private http: HttpClient = inject(HttpClient);
  private windowTimer: any = null;
  private routerSubscription: Subscription | null = null;
  private isTracking = false;
  private context: 'preAuth' | 'postAuth' = 'preAuth';
  private sessionId: string = this.generateSessionId();
  private router = inject(Router);
  private currentPage: string = '';
  private interval = 30000;

  currentModule() {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        // Check the raw URL before Angular guards or redirects process it.
        // This is the only place where the original typed URL is still intact.
        this.checkStringForRisk(this.safeDecode(event.url), 'URL', event.url);

      } else if (event instanceof NavigationEnd) {
        // Flush the behavior snapshot for the page being left
        const snapshot = this.getBehaviorSnapshot();
        if (snapshot.mouseMoveCount >= 5 || snapshot.keyEventCount > 3) {
          console.log(`Flushing behavior snapshot for old page before navigating...`);
          this.http.post(`${environment.apiUrl}/Behavior/snapshot`, snapshot, { withCredentials: true }).subscribe({
            error: (err) => console.error('Behavior snapshot failed:', err)
          });
          this.snapshotComplete$.next(snapshot);
        }

        this.clearData();
        this.resetTimer();
        this.currentPage = event.urlAfterRedirects;
      }
    });
  }

  

  getPatterns(): RiskPattern[] {
    return [...this.riskPatterns];
  }

  addCustomPattern(patternStr: string): void {
    const regex = new RegExp(patternStr, 'i');
    this.riskPatterns.push({ regex, label: patternStr, category: 'Custom', removable: true });
  }

  removeCustomPattern(label: string): void {
    const idx = this.riskPatterns.findIndex(p => p.removable && p.label === label);
    if (idx !== -1) this.riskPatterns.splice(idx, 1);
  }

  // Returns matched patterns — used by admin panel and console testInput/checkPatterns
  checkPatterns(text: string): { label: string; category: string }[] {
    const decoded = this.safeDecode(text);
    const matches = this.riskPatterns
      .filter(p => p.regex.test(decoded))
      .map(p => ({ label: p.label, category: p.category }));
    if (matches.length) {
      
    } else {
      
    }
    return matches;
  }

  simulateInput(text: string): boolean {
    return this.checkStringForRisk(text, 'Input');
  }

  simulateUrl(url: string): boolean {
    return this.checkStringForRisk(this.safeDecode(url), 'URL');
  }

  

  private safeDecode(text: string): string {
    try { return decodeURIComponent(text); } catch { return text; }
  }

  // DevTools detection via window dimension gap — docked DevTools enlarges the gap
  // between outer and inner dimensions by >160px
  private isDevToolsOpen(): boolean {
    return (
      window.outerWidth - window.innerWidth > 160 ||
      window.outerHeight - window.innerHeight > 160
    );
  }

  // Called by SecurityChallengeGuard when it blocks navigation during an active challenge
  public recordUnauthorizedAttempt(): void {
    this.unauthorizedAttempts++;
  }

  private checkStringForRisk(text: string, source: 'URL' | 'Input', sourceUrl?: string): boolean {
    for (const p of this.riskPatterns) {
      if (p.regex.test(text)) {
        const label = `[${p.category}] ${p.label} in ${source}`;
        console.warn(`SECURITY ALERT: ${label}`);

        // Record the pattern so it travels with the next snapshot to the DB
        if (!this.detectedPatterns.includes(label)) {
          this.detectedPatterns.push(label);
        }

        this.urgentAnomalyDetected$.next({
          reason: `[${p.category}] ${p.label} detected in ${source}`,
          detectedUrl: sourceUrl ?? this.currentPage
        });
        return true;
      }
    }
    return false;
  }

  private resetTimer() {
    if (this.windowTimer) {
      clearInterval(this.windowTimer);
      this.windowTimer = null;
    }
    this.startWindowTimer();
  }

  generateSessionId(): string {
    const existing = sessionStorage.getItem('behaviorSessionId');
    if (existing) {
      this.sessionId = existing;
      return this.sessionId;
    } else {
      this.sessionId = crypto.randomUUID();
      sessionStorage.setItem('behaviorSessionId', this.sessionId);
      return this.sessionId;
    }
  }

  setContext(ctx: 'preAuth' | 'postAuth' = 'preAuth') {
    this.context = ctx;
    console.log('Behavior context switched to: ', ctx);
  }

  start() {
    if (this.isTracking) return;
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    window.addEventListener('paste', this.handlePaste);

    console.log('Behavior tracking STARTED');
    this.isTracking = true;
    this.currentModule();
    this.startWindowTimer();
  }

  startWindowTimer() {
    console.log('Starting window timer for behavior snapshot...');
    console.log(this.getContext());
    if (this.windowTimer) return;

    this.windowTimer = setInterval(() => {
      const snapshot = this.getBehaviorSnapshot();
      if (snapshot.mouseMoveCount >= 5 || snapshot.keyEventCount > 3) {
        console.log('Sending window snapshot:', snapshot);
        this.http.post(`${environment.apiUrl}/Behavior/snapshot`, snapshot, { withCredentials: true })
          .subscribe({ error: (err) => console.error('Behavior snapshot failed:', err) });
        console.log('Behavior snapshot sent successfully');
        this.snapshotComplete$.next(snapshot);
      }
      this.clearData();
    }, this.interval);
  }

  private pushWithLimit<T>(arr: T[], value: T, limit = 200) {
    arr.push(value);
    if (arr.length > limit) arr.shift();
  }

  private handleMouseDown = (_event: MouseEvent) => {
    this.mouseDownTime = performance.now();
  };

  private handleMouseUp = (_event: MouseEvent) => {
    const now = performance.now();
    if (this.mouseDownTime) {
      this.pushWithLimit(this.clickDurations, now - this.mouseDownTime);
    }
    if (this.lastClickTime) {
      this.pushWithLimit(this.clickIntervals, now - this.lastClickTime);
    }
    if (this.mouseSpeeds.length > 0) {
      this.pushWithLimit(this.preClickSpeeds, this.mouseSpeeds[this.mouseSpeeds.length - 1]);
    }
    this.lastClickTime = now;
  };

  private handleMouseMove = (event: MouseEvent) => {
    const now = performance.now();
    if (this.lastMouseMoveTime && this.lastMousePosition) {
      const deltaTime = now - this.lastMouseMoveTime;
      const deltaX = event.clientX - this.lastMousePosition.x;
      const deltaY = event.clientY - this.lastMousePosition.y;
      const speed = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
      this.pushWithLimit(this.mouseSpeeds, speed);
      this.pushWithLimit(this.mouseIdleTimes, deltaTime);
    }
    this.lastMouseMoveTime = now;
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
  };

  private handleKeyDown = (event: KeyboardEvent) => {
    const now = performance.now();
    if (this.lastKeyDownTime) {
      this.pushWithLimit(this.keyFlightTimes, now - this.lastKeyDownTime);
    }
    this.keyDownTimestamps.set(event.key, now);
    this.lastKeyDownTime = now;

    // DevTools shortcut detection — F12, Ctrl+Shift+I/J/C, Ctrl+U
    // These are the first keys an attacker presses to inspect tokens or DOM
    if (
      event.key === 'F12' ||
      (event.ctrlKey && event.shiftKey && ['i', 'j', 'c'].includes(event.key.toLowerCase())) ||
      (event.ctrlKey && event.key.toLowerCase() === 'u')
    ) {
      this.devToolsShortcutCount++;
    }

    if (event.key.length === 1) {
      this.keystrokeBuffer += event.key;
      if (this.keystrokeBuffer.length > this.MAX_BUFFER_SIZE) {
        this.keystrokeBuffer = this.keystrokeBuffer.substring(this.keystrokeBuffer.length - this.MAX_BUFFER_SIZE);
      }
      this.checkStringForRisk(this.keystrokeBuffer, 'Input', this.currentPage);

      // Abnormal input length — nobody legitimately types 500+ chars into a form field
      const target = event.target as HTMLInputElement | HTMLTextAreaElement;
      if (target && 'value' in target && (target.value?.length ?? 0) > this.ABNORMAL_INPUT_THRESHOLD) {
        this.abnormalInputDetected = true;
      }
    } else if (event.key === 'Enter' || event.key === 'Tab') {
      this.keystrokeBuffer = '';
    }
  };

  // Paste detection — attackers paste payloads to bypass keystroke-by-keystroke buffer checks
  private handlePaste = (event: ClipboardEvent) => {
    this.pasteCount++;
    const text = event.clipboardData?.getData('text/plain') ?? '';

    // Long paste = fuzzing / buffer overflow attempt
    if (text.length > this.ABNORMAL_INPUT_THRESHOLD) {
      this.abnormalInputDetected = true;
    }

    // Check pasted content against attack patterns — fires urgentAnomalyDetected$ if matched
    if (text && this.checkStringForRisk(text, 'Input', this.currentPage)) {
      this.suspiciousPasteDetected = true;
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const now = performance.now();
    const downTime = this.keyDownTimestamps.get(event.key);
    if (downTime) {
      this.pushWithLimit(this.keyDwellTimes, now - downTime);
      this.keyDownTimestamps.delete(event.key);
    }
  };

  getContext() {
    return this.context;
  }

  private getUserIdFromToken(): string | null {
    const token = localStorage.getItem('access-Token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        || payload.nameid || payload.sub || payload.uid || payload.UserId || null;
    } catch {
      return null;
    }
  }

  getBehaviorSnapshot() {
    console.log('Generating behavior snapshot now...');
    const windowSeconds = 30;
    return {
      sessionId: this.sessionId,
      userId: this.getUserIdFromToken(),
      context: this.context,
      currentPage: this.currentPage,
      timestamp: new Date().toISOString(),
      avgMouseSpeed: this.average(this.mouseSpeeds),
      stdMouseSpeed: this.std(this.mouseSpeeds),
      mouseMoveCount: this.mouseSpeeds.length,
      avgMouseIdle: this.average(this.mouseIdleTimes),
      stdMouseIdle: this.std(this.mouseIdleTimes),
      avgClickDuration: this.average(this.clickDurations),
      stdClickDuration: this.std(this.clickDurations),
      clickCount: this.clickDurations.length,
      avgPreClickSpeed: this.average(this.preClickSpeeds),
      stdPreClickSpeed: this.std(this.preClickSpeeds),
      avgClickInterval: this.average(this.clickIntervals),
      stdClickInterval: this.std(this.clickIntervals),
      avgDwell: this.average(this.keyDwellTimes),
      stdDwell: this.std(this.keyDwellTimes),
      avgFlight: this.average(this.keyFlightTimes),
      stdFlight: this.std(this.keyFlightTimes),
      keyEventCount: this.keyDwellTimes.length,
      clickRate: this.clickDurations.length / windowSeconds,
      mouseMoveRate: this.mouseSpeeds.length / windowSeconds,
      typingRate: this.keyDwellTimes.length / windowSeconds,
      sessionDuration: windowSeconds,

      // Attack string detection — set by checkStringForRisk during this window
      hackingStringDetected: this.detectedPatterns.length > 0,
      detectedPatterns: this.detectedPatterns.join('; '),

      // Extended attack signals
      pasteCount: this.pasteCount,
      suspiciousPasteDetected: this.suspiciousPasteDetected,
      devToolsShortcutCount: this.devToolsShortcutCount,
      abnormalInputDetected: this.abnormalInputDetected,
      devToolsDetected: this.isDevToolsOpen(),
      unauthorizedAttempts: this.unauthorizedAttempts,
    };
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  private std(arr: number[]): number {
    if (arr.length === 0) return 0;
    const mean = this.average(arr);
    return Math.sqrt(arr.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / arr.length);
  }

  stop() {
    if (!this.isTracking) {
      console.log('Tracking already stopped');
      if (this.windowTimer) {
        clearInterval(this.windowTimer);
        this.windowTimer = null;
      }
      return;
    }
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('paste', this.handlePaste);

    if (this.windowTimer) {
      clearInterval(this.windowTimer);
      this.windowTimer = null;
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
      this.routerSubscription = null;
    }

    console.log('Behavior tracking STOPPED');
    this.isTracking = false;
  }

  clearData(): void {
    this.mouseSpeeds = [];
    this.mouseIdleTimes = [];
    this.lastMouseMoveTime = null;
    this.lastMousePosition = null;
    this.clickIntervals = [];
    this.clickDurations = [];
    this.preClickSpeeds = [];
    this.lastClickTime = null;
    this.mouseDownTime = null;
    this.keyDwellTimes = [];
    this.keyFlightTimes = [];
    this.keyDownTimestamps.clear();
    this.lastKeyDownTime = null;
    this.keystrokeBuffer = '';
    this.detectedPatterns = [];
    this.pasteCount = 0;
    this.suspiciousPasteDetected = false;
    this.devToolsShortcutCount = 0;
    this.abnormalInputDetected = false;
    this.unauthorizedAttempts = 0;
    // devToolsDetected is computed live via isDevToolsOpen(), no reset needed
    console.log('Behavior data cleared.');
  }
}
