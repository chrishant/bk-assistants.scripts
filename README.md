Here is a compact, professional **README.md** focused only on important details and technical clarity:

**BK Screens Automation Scripts**

Lightweight JavaScript automation scripts for BK web operational screens.
Designed to run directly in the Chrome Developer Console to automate repetitive UI workflows safely.

Purpose

Automate repetitive actions (Receiving, BOM, Setup screens)

Reduce manual clicking and scrolling

Handle modals and dynamic AngularJS grids

Improve execution speed without breaking page lifecycle

Environment

**Google Chrome (recommended)**

BK internal web application

Run via DevTools → Console

**Usage**

Open required BK screen

_Press F12 → Console_

Paste script and press Enter

**If blocked, type:**

_allow pasting_

**Core Capabilities**

Smart page-ready detection

Dynamic element waiting with timeout

Modal auto-detection and interaction

Controlled execution delay (async/await)

Safe handling of AngularJS ui-grid elements

Performance Notes

Delay timing is adjustable (wait(ms))

Avoid extremely low delays to prevent Angular digest conflicts

Chrome throttles background tabs (keep tab active for full speed)



**Limitations**

Manual execution only

Breaks if DOM structure changes

Stops on page reload

Dependent on UI selectors



**Safety**

Frontend-only automation (no backend manipulation)

Simulates user interaction

Test carefully before production use




**Author: Rishant Chaudhary**

**Usage: Internal Automation Only**
