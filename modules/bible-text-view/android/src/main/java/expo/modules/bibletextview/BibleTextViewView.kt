package expo.modules.bibletextview

import android.content.Context
import android.graphics.Color
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.TextPaint
import android.text.method.LinkMovementMethod
import android.text.style.BackgroundColorSpan
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.view.View
import androidx.appcompat.widget.AppCompatTextView
import com.facebook.react.views.text.ReactFontManager
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

data class Verse(val id: Int, val verseNumber: Int, val text: String)

class BibleTextViewView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    private val onVersePress by EventDispatcher()

    private var verses: List<Verse> = emptyList()
    private var selectedIds: Set<Int> = emptySet()
    private var textColor: Int = Color.BLACK
    private var dimmedAlpha: Float = 0.25f
    private var isDarkMode: Boolean = false
    private var textSizeSp: Float = 24f

    private val textView: AppCompatTextView

    private var customFontFamily: String? = null

    init {
        textView =
                AppCompatTextView(context).apply {
                    movementMethod = LinkMovementMethod.getInstance()
                    textSize = textSizeSp
                    setLineSpacing(0f, 1.6f)

                    // Text Direction for Hebrew
                    textDirection = View.TEXT_DIRECTION_ANY_RTL
                    gravity = android.view.Gravity.START

                    // Standard padding converted to pixels
                    val density = context.resources.displayMetrics.density
                    val hPadding = (24 * density).toInt()
                    val vPadding = (16 * density).toInt()
                    val bottomPadding = (100 * density).toInt() // Extra space at bottom

                    setPadding(hPadding, vPadding, hPadding, bottomPadding)

                    highlightColor = Color.TRANSPARENT
                    layoutParams =
                            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
                }

        addView(textView)

        // Listen for layout changes to report height
        textView.viewTreeObserver.addOnGlobalLayoutListener {
            val width = textView.width
            val height = textView.height
            if (width > 0 && height > 0) {
                onContentSizeChange(mapOf("width" to width, "height" to height))
            }
        }
    }

    private val onContentSizeChange by EventDispatcher()

    fun setVerses(verseList: List<Verse>) {
        this.verses = verseList
        rebuildText()
    }

    fun setSelectedIds(ids: Set<Int>) {
        this.selectedIds = ids
        rebuildText()
    }

    fun setTextColor(color: Int) {
        this.textColor = color
        rebuildText()
    }

    fun setDarkMode(dark: Boolean) {
        this.isDarkMode = dark
        rebuildText()
    }

    fun setTextSizeSp(size: Float) {
        this.textSizeSp = size
        textView.textSize = size
        rebuildText()
    }

    fun setFontFamily(familyName: String?) {
        this.customFontFamily = familyName
        applyFont()
    }

    private fun applyFont() {
        if (customFontFamily != null) {
            try {
                // Use ReactFontManager to resolve the font
                val typeface =
                        ReactFontManager.getInstance()
                                .getTypeface(customFontFamily!!, 0, context.assets)
                textView.typeface = typeface
            } catch (e: Exception) {
                // Fallback or log
            }
        }
    }

    private fun getDimmedColor(): Int {
        val alpha = (255 * dimmedAlpha).toInt()
        return if (isDarkMode) {
            Color.argb(alpha, 255, 255, 255)
        } else {
            Color.argb(alpha, 0, 0, 0)
        }
    }

    private fun getHighlightColor(): Int {
        return if (isDarkMode) {
            Color.argb(40, 255, 255, 255)
        } else {
            Color.argb(20, 0, 0, 0)
        }
    }

    private fun rebuildText() {
        val builder = SpannableStringBuilder()
        val hasSelection = selectedIds.isNotEmpty()
        val dimmedColor = getDimmedColor()
        val highlightColor = getHighlightColor()
        val numberColor = Color.GRAY
        val dimmedNumberColor = dimmedColor

        verses.forEach { verse ->
            val isSelected = selectedIds.contains(verse.id)
            val isDimmed = hasSelection && !isSelected
            val color = if (isDimmed) dimmedColor else textColor
            val numColor = if (isDimmed) dimmedNumberColor else numberColor

            // Add verse number
            val numStart = builder.length
            builder.append(" ${verse.verseNumber} ")
            builder.setSpan(
                    ForegroundColorSpan(numColor),
                    numStart,
                    builder.length,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )

            // Add verse text with click handler
            val textStart = builder.length
            builder.append(verse.text)

            // Text color
            builder.setSpan(
                    ForegroundColorSpan(color),
                    textStart,
                    builder.length,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )

            // Background highlight for selected
            if (isSelected) {
                builder.setSpan(
                        BackgroundColorSpan(highlightColor),
                        textStart,
                        builder.length,
                        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
                )
            }

            // Click handler
            val verseId = verse.id
            builder.setSpan(
                    object : ClickableSpan() {
                        override fun onClick(widget: View) {
                            onVersePress(mapOf("verseId" to verseId))
                        }
                        override fun updateDrawState(ds: TextPaint) {
                            ds.isUnderlineText = false
                            ds.color = color
                        }
                    },
                    textStart,
                    builder.length,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }

        textView.text = builder
        applyFont()

        // Use a simpler requestLayout approach
        textView.requestLayout()
    }
}
