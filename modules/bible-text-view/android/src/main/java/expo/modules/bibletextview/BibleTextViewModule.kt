package expo.modules.bibletextview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class BibleTextViewModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("bible-text-view")

        View(BibleTextViewView::class) {
            // Verses prop - receives array of verse objects
            Prop("verses") { view: BibleTextViewView, verses: List<Map<String, Any>> ->
                val verseList = verses.map { map ->
                    Verse(
                        id = (map["id"] as Number).toInt(),
                        verseNumber = (map["verse"] as Number).toInt(),
                        text = map["text"] as String
                    )
                }
                view.setVerses(verseList)
            }
            
            // Selected verse IDs
            Prop("selectedIds") { view: BibleTextViewView, ids: List<Int> ->
                view.setSelectedIds(ids.toSet())
            }
            
            // Text color (as integer)
            Prop("textColor") { view: BibleTextViewView, color: Int ->
                view.setTextColor(color)
            }
            
            // Dark mode flag
            Prop("darkMode") { view: BibleTextViewView, dark: Boolean ->
                view.setDarkMode(dark)
            }
            
            // Text size in sp
            Prop("textSize") { view: BibleTextViewView, size: Double ->
                view.setTextSizeSp(size.toFloat())
            }

            // Font Family
            Prop("fontFamily") { view: BibleTextViewView, familyName: String ->
                view.setFontFamily(familyName)
            }
            
            // Event when verse is pressed
            Events("onVersePress", "onContentSizeChange")
        }
    }
}
