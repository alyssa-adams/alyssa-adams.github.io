%% Start of file `awesome-cv.cls'.
% Awesome CV Class File
%
% This class has been downloaded from:
% https://github.com/posquit0/Awesome-CV
%
% Author:
% Claud D. Park <posquit0.bj@gmail.com>
% http://www.posquit0.com
%
% Notes:
% 1) This class file defines the structure and layout of the template file (cv.tex, resume.tex).
% 2) It has been written in such a way that under most circumstances you 
% should not need to edit it.
%
% Class license:
% LPPL v1.3c (http://www.latex-project.org/lppl)
%


%-------------------------------------------------------------------------------
%                Identification
%-------------------------------------------------------------------------------
\ProvidesClass{awesome-cv}[2015/12/14 v1.3 Awesome Curriculum Vitae Class]
\NeedsTeXFormat{LaTeX2e}


%-------------------------------------------------------------------------------
%                Class options
%
% (need to be done before the external package loading, for example because
% we need \paperwidth, \paperheight and \@ptsize to be defined before loading
% geometry and fancyhdr)
%-------------------------------------------------------------------------------
% Options for draft or final
\DeclareOption{draft}{\setlength\overfullrule{5pt}}
\DeclareOption{final}{\setlength\overfullrule{0pt}}
% Inherit options of article
\DeclareOption*{
  \PassOptionsToClass{\CurrentOption}{article}
}
\ProcessOptions\relax
\LoadClass{article}


%-------------------------------------------------------------------------------
%                3rd party packages
%-------------------------------------------------------------------------------
% Needed to make fixed length table
\RequirePackage{array}
% Needed to handle list environment
\RequirePackage{enumitem}
% Needed to handle text alignment
\RequirePackage{ragged2e}
% Needed to configure page layout
\RequirePackage{geometry}
% Needed to make header & footer effeciently
\RequirePackage{fancyhdr}
% Needed to manage colors
\RequirePackage{xcolor}
% Needed to use \ifxetex-\else-\fi statement
\RequirePackage{ifxetex}
% Needed to use \if-\then-\else statement
\RequirePackage{xifthen}
% Needed to use a toolbox of programming tools
\RequirePackage{etoolbox}
% Needed to change line spacing in specific environment
\RequirePackage{setspace}
% Needed to manage fonts
\ifxetex
  \RequirePackage[quiet]{fontspec}
  % To support LaTeX quoting style
  \defaultfontfeatures{Ligatures=TeX}
\else
  \RequirePackage[T1]{fontenc}
  % Replace by the encoding you are using
  \RequirePackage[utf8]{inputenc}
\fi
% Needed to manage math fonts
\RequirePackage[math-style=TeX]{unicode-math}
% Needed to use icons from font-awesome
% (https://github.com/posquit0/latex-fontawesome)
\RequirePackage{fontawesome}
% Needed to deal a paragraphs
\RequirePackage{parskip}
% Needed to deal hyperlink
\RequirePackage{hyperref}
\hypersetup{
  pdftitle={},
  pdfauthor={},
  pdfsubject={},
  pdfkeywords={},
  colorlinks=false,
  allbordercolors=white
}


%-------------------------------------------------------------------------------
%                Configuration for directory locations
%-------------------------------------------------------------------------------
% Configure a directory location for fonts(default: 'fonts/')
\newcommand*{\fontdir}[1][fonts/]{\def\@fontdir{#1}}
\fontdir


%-------------------------------------------------------------------------------
%                Configuration for layout
%-------------------------------------------------------------------------------
%% Page Layout
% Configure page margins with geometry
% (was left/right 2.0cm, top 1.5cm, bottom 2.0cm, footskip .5cm: wider margins
%  shorten the 9pt monospace measure, and the footer gets room to breathe)
\geometry{left=2.2cm, top=2.0cm, right=2.2cm, bottom=2.4cm, footskip=1.0cm}

%% Vertical rhythm: every gap in the CV body comes from these lengths, so
%% similar things get similar space everywhere. (Added for the calm/spacious pass.)
% Leading
\newlength{\cvtitleleading}     \setlength{\cvtitleleading}{14pt}    % 11pt entry titles that wrap
\newlength{\cvpositionleading}  \setlength{\cvpositionleading}{12.5pt}% 9pt position / author rows
\newlength{\cvdescleading}      \setlength{\cvdescleading}{12.5pt}   % 9pt bullet text (was 11pt)
% Gaps
\newlength{\cvsectionskip}      \setlength{\cvsectionskip}{32pt}     % above a section title
\newlength{\cvsectionafterskip} \setlength{\cvsectionafterskip}{19pt}% section rule -> first entry (wins over \cventryskip there)
\newlength{\cventryskip}        \setlength{\cventryskip}{17pt}       % between entries
\newlength{\cvsubpositionskip}  \setlength{\cvsubpositionskip}{11pt} % entry -> its sub-position
\newlength{\cvtitlepositiongap} \setlength{\cvtitlepositiongap}{2pt} % title row -> position/authors row
\newlength{\cvheadtoitems}      \setlength{\cvheadtoitems}{5pt}      % entry heading -> first bullet
\newlength{\cvitemsep}          \setlength{\cvitemsep}{3pt}          % between bullets (was 2pt)
\newlength{\cvhonorskip}        \setlength{\cvhonorskip}{5pt}        % between honours rows
% Horizontal
\newlength{\cvcolgap}           \setlength{\cvcolgap}{24pt}          % min gap between left text and right-aligned date/location
\newlength{\cvitemindent}       \setlength{\cvitemindent}{11pt}      % bullet text indent (was 2ex, about 8pt)

%% Header & Footer
% Set offset to each header and offset
\fancyhfoffset{0em}
% Remove head rule
\renewcommand{\headrulewidth}{0pt}
% Clear all header & footer fields
\fancyhf{}
% Enable if you want to make header or footer using fancyhdr
\pagestyle{fancy}


%-------------------------------------------------------------------------------
%                Configuration for colors
%-------------------------------------------------------------------------------
% Gray-scale colors
\definecolor{white}{HTML}{FFFFFF}
\definecolor{black}{HTML}{000000}
\definecolor{darkgray}{HTML}{333333}
\definecolor{gray}{HTML}{5D5D5D}
\definecolor{lightgray}{HTML}{999999}
% Basic colors
\definecolor{green}{HTML}{C2E15F}
\definecolor{orange}{HTML}{FDA333}
\definecolor{purple}{HTML}{D3A4F9}
\definecolor{red}{HTML}{FB4485}
\definecolor{blue}{HTML}{6CE0F1}
% Text colors
\definecolor{darktext}{HTML}{414141}
\colorlet{text}{darkgray}
\colorlet{graytext}{gray}
\colorlet{lighttext}{lightgray}
% Awesome colors
\definecolor{awesome-emerald}{HTML}{00A388}
\definecolor{awesome-skyblue}{HTML}{0395DE}
\definecolor{awesome-red}{HTML}{DC3522}
\definecolor{awesome-pink}{HTML}{EF4089}
\definecolor{awesome-orange}{HTML}{FF6138}
\definecolor{awesome-nephritis}{HTML}{27AE60}
\definecolor{awesome-concrete}{HTML}{95A5A6}
\definecolor{awesome-darknight}{HTML}{131A28}
% CMYK-inspired palette (matching website)
\definecolor{cmyk-cyan}{HTML}{00E5E5}
\definecolor{cmyk-magenta}{HTML}{E500CC}
\definecolor{cmyk-yellow}{HTML}{E5D800}
\definecolor{cmyk-key}{HTML}{131A28}
% Intermediate gradient colors for rainbow name
\definecolor{cmyk-cm1}{HTML}{00C8D9}
\definecolor{cmyk-cm2}{HTML}{2BA0D0}
\definecolor{cmyk-cm3}{HTML}{5578C7}
\definecolor{cmyk-cm4}{HTML}{8050BE}
\definecolor{cmyk-cm5}{HTML}{AA28B5}
\definecolor{cmyk-my1}{HTML}{E510B0}
\definecolor{cmyk-my2}{HTML}{E53C8E}
\definecolor{cmyk-my3}{HTML}{E5686C}
\definecolor{cmyk-my4}{HTML}{E5944A}
\definecolor{cmyk-my5}{HTML}{E5B628}
\colorlet{awesome}{cmyk-cyan}

% Awesome section color
\newcounter{colorCounter}
\def\@sectioncolor#1#2#3{%
  {%
    \color{%
      \ifcase\value{colorCounter}%
        awesome\or%
        awesome\or%
        awesome\or%
        awesome\or%
        awesome\else%
        awesome\fi%
    } #1#2#3%
  }%
  \stepcounter{colorCounter}%
}


%-------------------------------------------------------------------------------
%                Configuration for fonts
%-------------------------------------------------------------------------------
% Display font for header name (Major Mono Display — single weight, faux bold)
\newfontfamily\displayfont[
  Path=\@fontdir,
  UprightFont=MajorMonoDisplay-Regular,
  FakeBold=1.5,
]{MajorMonoDisplay}

% Heading font (Syne Mono — single weight)
\newfontfamily\headingfont[
  Path=\@fontdir,
  UprightFont=SyneMono-Regular,
]{SyneMono}

% Set font for header (Inconsolata)
\newfontfamily\headerfont[
  Path=\@fontdir,
  UprightFont=Inconsolata-Regular,
  BoldFont=Inconsolata-Bold,
]{Inconsolata}

\newfontfamily\headerfontlight[
  Path=\@fontdir,
  UprightFont=Inconsolata-Light,
  BoldFont=Inconsolata-Regular,
]{Inconsolata}

% Set font for footer (Inconsolata)
\newfontfamily\footerfont[
  Path=\@fontdir,
  UprightFont=Inconsolata-Regular,
  BoldFont=Inconsolata-Bold,
]{Inconsolata}

% Set font for body (Inconsolata)
% WordSpace={1,0,0}: rigid word spaces (no stretch/shrink), so ragged-right
% lines keep the monospace grid instead of opening up uneven gaps.
\newfontfamily\bodyfont[
  Path=\@fontdir,
  UprightFont=Inconsolata-Regular,
  BoldFont=Inconsolata-Bold,
  WordSpace={1,0,0},
]{Inconsolata}

\newfontfamily\bodyfontlight[
  Path=\@fontdir,
  UprightFont=Inconsolata-Light,
  BoldFont=Inconsolata-Regular,
  WordSpace={1,0,0},
]{Inconsolata}

% One space width everywhere: no extra space after full stops and colons,
% which in a monospace face reads as a stray double space.
\AtBeginDocument{\frenchspacing}


%-------------------------------------------------------------------------------
%                Configuration for styles
%-------------------------------------------------------------------------------
% Configure styles for each CV elements
% For fundamental structures
% Rainbow gradient name helper
\newcommand*{\rainbowname}{%
  \makebox[\textwidth]{%
  {\fontsize{46pt}{1em}\displayfont\bfseries%
    \textcolor{cmyk-cyan}{A}%
    \textcolor{cmyk-cm1}{l}%
    \textcolor{cmyk-cm2}{y}%
    \textcolor{cmyk-cm3}{s}%
    \textcolor{cmyk-cm4}{s}%
    \textcolor{cmyk-cm5}{a}%
    \hspace{0.4em}%
    \textcolor{cmyk-magenta}{M}%
    \textcolor{cmyk-my1}{.}%
    \hspace{0.4em}%
    \textcolor{cmyk-my2}{A}%
    \textcolor{cmyk-my3}{d}%
    \textcolor{cmyk-my4}{a}%
    \textcolor{cmyk-my5}{m}%
    \textcolor{cmyk-yellow}{s}%
  }}%
}
\newcommand*{\headerfirstnamestyle}[1]{{\fontsize{40pt}{1em}\displayfont\color{graytext} #1}}
\newcommand*{\headerlastnamestyle}[1]{{\fontsize{40pt}{1em}\displayfont\color{text} #1}}
\newcommand*{\headerpositionstyle}[1]{{\fontsize{14pt}{1em}\headingfont\color{awesome} #1}}
\newcommand*{\headeraddressstyle}[1]{{\fontsize{8pt}{1em}\headerfont\itshape\color{lighttext} #1}}
\newcommand*{\headersocialstyle}[1]{{\fontsize{8pt}{1em}\headerfont\color{darktext} #1}}
\newcommand*{\headerquotestyle}[1]{{\fontsize{8pt}{1em}\bodyfont\itshape\color{darktext} #1}}
\newcommand*{\footerstyle}[1]{{\fontsize{8pt}{1em}\footerfont\scshape\color{lighttext} #1}}
\newcommand*{\sectionstyle}[1]{{\fontsize{20pt}{1em}\headingfont\color{text} #1}}
\newcommand*{\subsectionstyle}[1]{{\fontsize{20pt}{1em}\bodyfont\scshape\textcolor{text}{#1}}}

% For elements of entry
\newcommand*{\entrytitlestyle}[1]{{\fontsize{11pt}{1em}\bodyfont\bfseries\color{darktext}\hypersetup{urlcolor=black}\leavevmode{}#1}}
\newcommand*{\entrypositionstyle}[1]{{\fontsize{9pt}{1em}\bodyfont\bfseries\color{graytext} #1}}
% Dates: regular weight (was bold) so the right-hand column stays quiet and the titles lead
\newcommand*{\entrydatestyle}[1]{{\fontsize{9pt}{1em}\bodyfont\mdseries\color{graytext} #1}}
\newcommand*{\entrylocationstyle}[1]{{\fontsize{9pt}{1em}\bodyfontlight\color{graytext} #1}}
\newcommand*{\descriptionstyle}[1]{{\fontsize{9pt}{\cvdescleading}\bodyfontlight\upshape\color{text} #1}}

% For elements of subentry
\newcommand*{\subentrytitlestyle}[1]{{\fontsize{8pt}{1em}\bodyfont\mdseries\color{graytext} #1}}
\newcommand*{\subentrypositionstyle}[1]{{\fontsize{7pt}{1em}\bodyfont\scshape\color{graytext} #1}}
\newcommand*{\subentrydatestyle}[1]{{\fontsize{7pt}{1em}\bodyfontlight\slshape\color{graytext} #1}}
\newcommand*{\subentrylocationstyle}[1]{{\fontsize{7pt}{1em}\bodyfontlight\slshape\color{graytext} #1}}
\newcommand*{\subdescriptionstyle}[1]{{\fontsize{8pt}{1em}\bodyfontlight\upshape\color{text} #1}}

% For elements of honor
\newcommand*{\honortitlestyle}[1]{{\fontsize{9pt}{1em}\bodyfont\color{graytext} #1}}
\newcommand*{\honorpositionstyle}[1]{{\fontsize{9pt}{1em}\bodyfont\bfseries\color{darktext} #1}}
\newcommand*{\honordatestyle}[1]{{\fontsize{9pt}{1em}\bodyfont\color{graytext} #1}}
% The honours year sits in this slot; styled like the entry dates so all years match
\newcommand*{\honorlocationstyle}[1]{{\fontsize{9pt}{1em}\bodyfont\mdseries\upshape\color{graytext} #1}}

% For elements of skill
\newcommand*{\skilltypestyle}[1]{{\fontsize{10pt}{1em}\bodyfont\bfseries\color{darktext} #1}}
\newcommand*{\skillsetstyle}[1]{{\fontsize{9pt}{1em}\bodyfontlight\color{text} #1}}

% For elements of the cover letter
\newcommand*{\paragraphstyle}[1]{{\fontsize{14pt}{1em}\bodyfont\bfseries\color{text}\@sectioncolor #1}}
\newcommand*{\recipientaddressstyle}[1]{{\fontsize{9pt}{1em}\bodyfont\scshape\color{graytext} #1}}
\newcommand*{\recipienttitlestyle}[1]{{\fontsize{11pt}{1em}\bodyfont\bfseries\color{darktext} #1}}
\newcommand*{\lettertitlestyle}[1]{{\fontsize{10pt}{1em}\bodyfontlight\bfseries\color{darktext} \underline{#1}}}
\newcommand*{\letterdatestyle}[1]{{\fontsize{9pt}{1em}\bodyfontlight\slshape\color{graytext} #1}}
\newcommand*{\lettertextstyle}{\fontsize{10pt}{1.4em}\bodyfontlight\upshape\color{graytext}}
\newcommand*{\letternamestyle}[1]{{\fontsize{10pt}{1em}\bodyfont\bfseries\color{darktext} #1}}
\newcommand*{\letterenclosurestyle}[1]{{\fontsize{10pt}{1em}\bodyfontlight\slshape\color{lighttext} #1}}


%-------------------------------------------------------------------------------
%                Commands for personal information
%-------------------------------------------------------------------------------
% Define writer's name
% Usage: \name{<firstname>}{<lastname>}
% Usage: \firstname{<firstname>}
% Usage: \lastname{<lastname>}
% Usage: \familyname{<familyname>}
\newcommand*{\name}[2]{\def\@firstname{#1}\def\@lastname{#2}}
\newcommand*{\firstname}[1]{\def\@firstname{#1}}
\newcommand*{\lastname}[1]{\def\@lastname{#1}}
\newcommand*{\familyname}[1]{\def\@lastname{#1}}
\def\@familyname{\@lastname}

% Define writer's address
% Usage: \address{<address>}
\newcommand*{\address}[1]{\def\@address{#1}}

% Define writer's position
% Usage: \name{<position>}
\newcommand*{\position}[1]{\def\@position{#1}}

% Defines writer's mobile (optional)
% Usage: \mobile{<mobile number>}
\newcommand*{\mobile}[1]{\def\@mobile{#1}}

% Defines writer's email (optional)
% Usage: \email{<email adress>}
\newcommand*{\email}[1]{\def\@email{#1}}

% Defines writer's homepage (optional)
% Usage: \homepage{<url>}
\newcommand*{\homepage}[1]{\def\@homepage{#1}}

% Defines writer's github (optional)
% Usage: \github{<github-nick>}
\newcommand*{\github}[1]{\def\@github{#1}}

% Defines writer's linked-in (optional)
% Usage: \linkedin{<linked-in-nick>}
\newcommand*{\linkedin}[1]{\def\@linkedin{#1}}

% Defines writer's stackoverflow profile (optional)
% Usage: \stackoverflow{<so userid>}{<so username>}
%   e.g.https://stackoverflow.com/users/123456/sam-smith
%       would be \stackoverflow{123456}{sam-smith}
\newcommand*{\stackoverflow}[2]{\def\@stackoverflowid{#1}\def\@stackoverflowname{#2}}

% Defines writer's skype (optional)
% Usage: \skype{<skype account>}
\newcommand*{\skype}[1]{\def\@skype{#1}}

% Defines writer's twitter (optional)
% Usage: \twitter{<twitter handle>}
\newcommand*{\twitter}[1]{\def\@twitter{#1}}

% Defines writer's Google Scholar (optional)
% Usage: \googlescholar{<scholar user id>}
\newcommand*{\googlescholar}[1]{\def\@googlescholar{#1}}

% Defines writer's ORCID iD (optional)
% Usage: \orcid{<0000-0000-0000-0000>}
\newcommand*{\orcid}[1]{\def\@orcid{#1}}

% Defines writer's quote (optional)
% Usage: \quote{<quote>}
\renewcommand*{\quote}[1]{\def\@quote{#1}}

% Defines recipient's information (cover letter only)
% Usage: \recipient{<recipient name>}{<recipient address>}
% Usage: \recipientname{<recipient name>}
% Usage: \recipientaddress{<recipient address>}
\newcommand*{\recipient}[2]{\def\@recipientname{#1}\def\@recipientaddress{#2}}
\newcommand*{\recipientname}[1]{\def\@recipientname{#1}}
\newcommand*{\recipientaddress}[1]{\def\@recipientaddress{#1}}

% Defines the title for letter (cover letter only, optional)
% Usage: \lettertitle{<title>}
\newcommand*{\lettertitle}[1]{\def\@lettertitle{#1}}

% Defines the date for letter (cover letter only)
% Usage: \letterdate{<date>}
\newcommand*{\letterdate}[1]{\def\@letterdate{#1}}

% Defines a message of opening for letter (cover letter only)
% Usage: \letteropening{<message>}
\newcommand*{\letteropening}[1]{\def\@letteropening{#1}}

% Defines a message of closing for letter (cover letter only)
% Usage: \letterclosing{<message>}
\newcommand*{\letterclosing}[1]{\def\@letterclosing{#1}}

% Defines an enclosure for letter (cover letter only, optional)
% Usage: \letterenclosure[<enclosure name>]{<enclosure>}
\newcommand*{\letterenclname}[1][Enclosure]{\def\@letterenclname{#1}}
\newcommand*{\letterenclosure}[2][]{
  % if an optional argument is provided, use it to redefine \enclname
  \ifthenelse{\equal{#1}{}}{}{\def\@letterenclname{#1}}
  \def\@letterenclosure{#2}
}


%-------------------------------------------------------------------------------
%                Commands for extra
%-------------------------------------------------------------------------------
% Define separator for social informations in header
% Usage: \headersocialsep{<separator>}
% Default: \quad\textbar\quad
\newcommand*{\headersocialsep}[1][\quad\textbar\quad]{\def\@headersocialsep{#1}}
\headersocialsep


%-------------------------------------------------------------------------------
%                Commands for utilities
%-------------------------------------------------------------------------------
% Use to align an element of tabular table
\newcolumntype{L}[1]{>{\raggedright\let\newline\\\arraybackslash\hspace{0pt}}m{#1}}
\newcolumntype{C}[1]{>{\centering\let\newline\\\arraybackslash\hspace{0pt}}m{#1}}
\newcolumntype{R}[1]{>{\raggedleft\let\newline\\\arraybackslash\hspace{0pt}}m{#1}}

% Use to draw horizontal line with specific tickness
\def\vhrulefill#1{\leavevmode\leaders\hrule\@height#1\hfill \kern\z@}

% Use to execute conditional statements by checking empty string
\newcommand*{\ifempty}[3]{\ifthenelse{\isempty{#1}}{#2}{#3}}


%-------------------------------------------------------------------------------
%                Commands for elements of CV structure
%-------------------------------------------------------------------------------
% One link in the header's social line: separator first unless it is the first item
\newbool{isstart}
\newcommand*{\cv@socialitem}[1]{%
  \ifbool{isstart}{\setbool{isstart}{false}}{\@headersocialsep}#1%
}

% Define a header for CV
% Usage: \makecvheader
% (The top margin is now 2.0cm, so the extra 3mm push-down above the name is
%  gone: the name sits where it did. The gap under the links is 1mm, was 6mm,
%  because \cvsectionskip already gives the first section its air.)
\newcommand*{\makecvheader}{
  \begin{center}
    \rainbowname{}
    \\
    \vspace{4mm}
    \ifthenelse{\isundefined{\@position}}{}{\headerpositionstyle{\@position\\}}
    \vspace{4mm}
    \ifthenelse{\isundefined{\@address}}{}{\headeraddressstyle{\@address\\}}
    \vspace{-0.5mm}
    % Every line below ends in % so no stray spaces creep in: the old version
    % leaked a different number of spaces before each separator, so the gaps
    % between the five links were uneven.
    \headersocialstyle{%
      \setbool{isstart}{true}%
      \ifthenelse{\isundefined{\@mobile}}{}%
        {\cv@socialitem{\textcolor{darktext}{\faMobile}\ \@mobile}}%
      \ifthenelse{\isundefined{\@email}}{}%
        {\cv@socialitem{\href{mailto:\@email}{\textcolor{darktext}{\faEnvelope}\ \@email}}}%
      \ifthenelse{\isundefined{\@homepage}}{}%
        {\cv@socialitem{\href{https://www.\@homepage}{\textcolor{darktext}{\faHome}\ \@homepage}}}%
      \ifthenelse{\isundefined{\@github}}{}%
        {\cv@socialitem{\href{https://github.com/\@github}{\textcolor{darktext}{\faGithubSquare}\ \@github}}}%
      \ifthenelse{\isundefined{\@stackoverflowid}}{}%
        {\cv@socialitem{\href{https://stackoverflow.com/users/\@stackoverflowid}{\textcolor{darktext}{\faStackOverflow}\ \@stackoverflowname}}}%
      \ifthenelse{\isundefined{\@linkedin}}{}%
        {\cv@socialitem{\href{https://www.linkedin.com/in/\@linkedin}{\textcolor{darktext}{\faLinkedinSquare}\ \@linkedin}}}%
      \ifthenelse{\isundefined{\@googlescholar}}{}%
        {\cv@socialitem{\href{https://scholar.google.com/citations?user=\@googlescholar}{\textcolor{darktext}{\faGraduationCap}\ Google Scholar}}}%
      \ifthenelse{\isundefined{\@orcid}}{}%
        {\cv@socialitem{\mbox{\href{https://orcid.org/\@orcid}{\textcolor{darktext}{\faLink}\ ORCID}}}}%
      \ifthenelse{\isundefined{\@twitter}}{}%
        {\cv@socialitem{\href{https://twitter.com/\@twitter}{\textcolor{darktext}{\faTwitter}\ \@twitter}}}%
      \ifthenelse{\isundefined{\@skype}}{}%
        {\cv@socialitem{\faSkype\ \@skype}}%
    }\\
    \ifthenelse{\isundefined{\@quote}}
      {\vspace{1mm}}
      {\vspace{6.0mm}\headerquotestyle{\@quote\\}\vspace{1.0mm}}
  \end{center}
}

% Define a footer for CV
% Usage: \makecvfooter{<left>}{<center>}{<right>}
\newcommand*{\makecvfooter}[3]{
  \fancyfoot{}
  \fancyfoot[L]{
    \footerstyle{#1}
  }
  \fancyfoot[C]{
    \footerstyle{#2}
  }
  \fancyfoot[R]{
    \footerstyle{#3}
  } 
}

% Define a section for CV
% Usage: \cvsection{<section-title>}
% (Spacing comes from \cvsectionskip / \cvsectionafterskip; the rule is 0.6pt,
%  was 0.9pt, and its \color{black} no longer leaks into the rest of the page.)
\newcommand{\cvsection}[1]{%
  \par\addvspace{\cvsectionskip}%
  \begingroup\setlength{\parskip}{\z@}%
    \noindent\phantomsection{}%
    \sectionstyle{#1}\hspace{0.5em}{\color{black}\vhrulefill{0.6pt}}\par
  \endgroup
  \nobreak\addvspace{\cvsectionafterskip}%
}

% Define a subsection for CV
% Usage: \cvsubsection{<subsection-title>}
\newcommand{\cvsubsection}[1]{
  \phantomsection{}
  \subsectionstyle{#1}
}

% One heading row of an entry: <left> on the left, <right> flush right on the
% FIRST line. The left text wraps ragged-right (no hyphenation) in whatever room
% the right text leaves, so a long publication title can use the full width when
% its right side only holds a year, instead of wrapping at a fixed 11cm column.
% Usage: \cv@row{<leading>}{<styled left>}{<styled right>}{<raw right, for the empty test>}
% Balanced ragged-right, used for headings and bullets: no hyphenation, all the
% slack goes to the right edge (word spaces are rigid), and a wrapped paragraph
% is broken so its last line is not one stranded word: TeX may shorten earlier
% lines by up to \cv@raggedstretch to pull the last line out towards \cv@lastline.
% (Both are in em of the current font: 20em/18em is 40/36 characters of Inconsolata.)
% Usage: \cv@ragged{<line width>}
\def\cv@raggedstretch{20em}
\def\cv@lastline{18em}
\newcommand*{\cv@ragged}[1]{%
  \let\\\@centercr
  \leftskip\z@skip
  \@rightskip\z@\@plus\cv@raggedstretch\relax
  \rightskip\@rightskip
  \parfillskip\z@\@plus\dimexpr#1-\cv@lastline\relax
  \hyphenpenalty\@M
  \emergencystretch3em
}

\newlength{\cv@rightw}
\newcommand{\cv@row}[4]{%
  \par
  \begingroup
    \setlength{\baselineskip}{#1}%
    \ifempty{#4}%
      {\setlength{\cv@rightw}{\z@}}%
      {\settowidth{\cv@rightw}{#3}\addtolength{\cv@rightw}{\cvcolgap}}%
    \cv@ragged{\dimexpr\linewidth-\cv@rightw\relax}%
    \parshape\@ne\z@\dimexpr\linewidth-\cv@rightw\relax
    \noindent\rlap{\hb@xt@\linewidth{\hfil#3}}#2\par
  \endgroup
}

% Define an environment for cventry
\newenvironment{cventries}{}{}
% Define an entry of cv information
% Usage: \cventry{<position>}{<title>}{<location>}{<date>}{<description>}
% Each entry is one unbreakable box, so an entry is never split across pages;
% the box sits on its last baseline so the gap to the next entry is the same
% everywhere (\cventryskip).
\newcommand*{\cventry}[5]{%
  \par\addvspace{\cventryskip}%
  \begingroup\setlength{\parskip}{\z@}%
  \noindent\begin{minipage}[b]{\linewidth}%
    \ifempty{#2#3}%
      {\cv@row{\cvpositionleading}{\entrypositionstyle{#1}}{\entrydatestyle{#4}}{#4}}%
      {\cv@row{\cvtitleleading}{\entrytitlestyle{#2}}{\entrydatestyle{#4}}{#4}%
       \ifempty{#1#3}{}{%
         \vspace{\cvtitlepositiongap}%
         \cv@row{\cvpositionleading}{\entrypositionstyle{#1}}{\entrylocationstyle{#3}}{#3}}}%
    \descriptionstyle{#5}%
  \end{minipage}\par
  \endgroup
}
% Define a subposition within an existing entry (for combined company entries)
% Usage: \cvsubposition{<position>}{<date>}{<description>}
\newcommand*{\cvsubposition}[3]{%
  \par\addvspace{\cvsubpositionskip}%
  \begingroup\setlength{\parskip}{\z@}%
  \noindent\begin{minipage}[b]{\linewidth}%
    \cv@row{\cvpositionleading}{\entrypositionstyle{#1}}{\entrydatestyle{#2}}{#2}%
    \descriptionstyle{#3}%
  \end{minipage}\par
  \endgroup
}

% Define an environment for cvsubentry
\newenvironment{cvsubentries}{
  \begin{center}
}{
  \end{center}
}
% Define a subentry of cv information
% Usage: \cvsubentry{<position>}{<title>}{<date>}{<description>}
\newcommand*{\cvsubentry}[4]{
  \setlength\tabcolsep{0pt}
  \setlength{\extrarowheight}{0pt}
  \begin{tabular*}{\textwidth}{@{\extracolsep{\fill}} L{12.5cm} R{4.5cm}}
    \setlength\leftskip{0.2cm}
    \subentrytitlestyle{#2} & \ifthenelse{\equal{#1}{}}
      {\subentrydatestyle{#3}}{} 
    \ifthenelse{\equal{#1}{}}
      {}
      {\subentrypositionstyle{#1} & \subentrydatestyle{#3} \\}
    \ifthenelse{\equal{#4}{}}
      {}
      {\multicolumn{2}{L{17.0cm}}{\subdescriptionstyle{#4}} \\}
  \end{tabular*}
}

% Define an environment for cvhonor
% (Was a tight tabular with fixed cm columns and vertically centred years; now
%  one row per honour with the same leading as bullets, a small gap between
%  rows, and the year on the first line.)
\newenvironment{cvhonors}{%
  \par\addvspace{\cvheadtoitems}%
  \begingroup
  \setlength{\parskip}{\z@}%
  \interlinepenalty\@M  % never split one honour across pages
}{%
  \par\endgroup
}
% Define a line of cv information(honor, award or something else)
% Usage: \cvhonor{<position>}{<title>}{<location>}{<date>}
\newcommand*{\cvhonor}[4]{%
  \par\addvspace{\cvhonorskip}%
  \cv@row{\cvdescleading}%
    {\ifempty{#4}{}{\honordatestyle{#4}\quad}\honorpositionstyle{#1}, \honortitlestyle{#2}}%
    {\honorlocationstyle{#3}}{#3}%
}

% Define an environment for cvskill
\newenvironment{cvskills}{
  \begin{center}
    \setlength\tabcolsep{1ex}
    \setlength{\extrarowheight}{0pt}
    \begin{tabular*}{\textwidth}{@{\extracolsep{\fill}} r L{15.2cm}}
}{
    \end{tabular*}
  \end{center}
}
% Define a line of cv information(skill)
% Usage: \cvskill{<type>}{<skillset>}
\newcommand*{\cvskill}[2]{
	\skilltypestyle{#1} & \skillsetstyle{#2} 
  \\
}

% Define an environment for cvitems(for cventry)
% Ragged-right with no hyphenation (was justified): in a monospace face,
% justification stretched the word gaps unevenly and split words at line ends.
% The closing \strut gives every entry the same last-line depth, so the gap to
% the next entry does not depend on whether the last line has descenders.
\newenvironment{cvitems}{%
  \cv@ragged{\linewidth}%
  \begin{itemize}[leftmargin=\cvitemindent, topsep=\cvheadtoitems, partopsep=0pt,
                  itemsep=\cvitemsep, parsep=0pt]
    \setlength{\parskip}{0pt}%
    \parfillskip\z@\@plus\dimexpr\linewidth-\cv@lastline\relax % the list resets it
    \renewcommand{\labelitemi}{\bullet}%
}{%
  \unskip\strut
  \end{itemize}%
}


%-------------------------------------------------------------------------------
%                Commands for elements of Cover Letter
%-------------------------------------------------------------------------------
% Define an environment for cvletter
\newenvironment{cvletter}{
  \lettertextstyle
}{
}

% Define a paragraph for cvletter
% Usage: \cvparagraph{<paragraph-title>}
\newcommand{\cvparagraph}[1]{
  \par\addvspace{2.5ex}
  \phantomsection{}
  \paragraphstyle{#1}
  \color{black}\vhrulefill{0.9pt}
  \par\nobreak\addvspace{0.4ex}
}

% Define a title of the cover letter
% Usage: \makelettertitle
\newcommand*{\makelettertitle}{
  \vspace{9mm}
  \setlength\tabcolsep{0pt}
  \setlength{\extrarowheight}{0pt}
  \begin{tabular*}{\textwidth}{@{\extracolsep{\fill}} L{12.5cm} R{4.5cm}}
    \recipienttitlestyle{\@recipientname} & \letterdatestyle{\@letterdate}
  \end{tabular*}
  \begin{singlespace}
    \recipientaddressstyle{\@recipientaddress} \\\\
  \end{singlespace}
  \ifthenelse{\isundefined{\@lettertitle}}
    {}
    {\lettertitlestyle{\@lettertitle} \\}
  \lettertextstyle{\@letteropening} 
}

% Define a closing of the cover letter
% Usage: \makeletterclosing
\newcommand*{\makeletterclosing}{
  \vspace{3.4mm}
  \lettertextstyle{\@letterclosing} \\\\
  \letternamestyle{\@firstname \@lastname}
  \ifthenelse{\isundefined{\@letterenclosure}}
    {\\}
    {
      \\\\\\
      \letterenclosurestyle{\@letterenclname:  \@letterenclosure} \\
    }
}
