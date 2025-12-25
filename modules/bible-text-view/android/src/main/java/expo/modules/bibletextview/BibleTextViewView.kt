package expo.modules.bibletextview

import android.content.Context
import android.graphics.Color
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.TextPaint
import android.text.method.LinkMovementMethod
import android.text.style.ClickableSpan
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
    private var lastReportedWidth: Int = 0
    private var lastReportedHeight: Int = 0

    // Maps to store current animated color state
    private val verseTextColors = mutableMapOf<Int, Int>()
    private val verseNumberColors = mutableMapOf<Int, Int>()
    private var colorAnimator: android.animation.ValueAnimator? = null

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
                    val bottomPadding = vPadding // Same as top padding

                    setPadding(hPadding, vPadding, hPadding, bottomPadding)

                    highlightColor = Color.TRANSPARENT
                    layoutParams =
                            LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT)
                }

        addView(textView)

        // Listen for layout changes to report height
        textView.viewTreeObserver.addOnGlobalLayoutListener { requestMeasure() }
    }

    private fun requestMeasure() {
        val width = textView.width
        if (width > 0) {
            var measuredHeight = 0

            // Prefer using the actual layout if available
            if (textView.layout != null) {
                measuredHeight =
                        textView.layout.height +
                                textView.compoundPaddingTop +
                                textView.compoundPaddingBottom
            } else {
                // Fallback to measure if layout is not yet ready
                val widthSpec = View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY)
                val heightSpec = View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
                textView.measure(widthSpec, heightSpec)
                measuredHeight = textView.measuredHeight
            }

            // Always emit if valid
            if (measuredHeight > 0 &&
                            (kotlin.math.abs(measuredHeight - lastReportedHeight) > 2 ||
                                    width != lastReportedWidth)
            ) {

                lastReportedWidth = width
                lastReportedHeight = measuredHeight

                // FIX: Convert Pixels to DIPs (Density Independent Pixels)
                val density = context.resources.displayMetrics.density
                val widthDp = width / density
                val heightDp = measuredHeight / density

                // Send the DIP values to React Native
                onContentSizeChange(mapOf("width" to widthDp, "height" to heightDp))
            }
        }
    }

    private val onContentSizeChange by EventDispatcher()

    fun setVerses(verseList: List<Verse>) {
        this.verses = verseList
        rebuildText()
    }

    fun setSelectedIds(ids: Set<Int>) {
        if (this.selectedIds != ids) {
            this.selectedIds = ids
            animateSelectionUpdate()
        }
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
        val r = Color.red(textColor)
        val g = Color.green(textColor)
        val b = Color.blue(textColor)
        return Color.argb(alpha, r, g, b)
    }

    private fun rebuildText() {
        // Reset colors
        verseTextColors.clear()
        verseNumberColors.clear()
        val dimmedColor = getDimmedColor()
        val numberColor = Color.GRAY
        val hasSelection = selectedIds.isNotEmpty()

        verses.forEach { verse ->
            val isSelected = selectedIds.contains(verse.id)
            val isDimmed = hasSelection && !isSelected

            // Initial Colors
            verseTextColors[verse.id] = if (isDimmed) dimmedColor else textColor
            verseNumberColors[verse.id] = if (isDimmed) dimmedColor else numberColor
        }

        val builder = SpannableStringBuilder()

        verses.forEach { verse ->
            // Add verse number in Hebrew
            val hebrewNum = toHebrewNumber(verse.verseNumber)
            val numStart = builder.length
            builder.append(" $hebrewNum ")

            // Dynamic Number Color Span
            builder.setSpan(
                    object : android.text.style.CharacterStyle() {
                        override fun updateDrawState(tp: TextPaint) {
                            tp.color = verseNumberColors[verse.id] ?: Color.GRAY
                        }
                    },
                    numStart,
                    builder.length,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )

            // Reduce verse number size
            builder.setSpan(
                    android.text.style.RelativeSizeSpan(0.75f),
                    numStart,
                    builder.length,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )

            // Add verse text
            val textStart = builder.length
            builder.append(verse.text)

            val verseId = verse.id
            builder.setSpan(
                    object : ClickableSpan() {
                        override fun onClick(widget: View) {
                            onVersePress(mapOf("verseId" to verseId))
                        }
                        override fun updateDrawState(ds: TextPaint) {
                            ds.isUnderlineText = false
                            ds.color = verseTextColors[verseId] ?: textColor
                        }
                    },
                    textStart,
                    builder.length,
                    Spanned.SPAN_EXCLUSIVE_EXCLUSIVE
            )
        }

        textView.text = builder
        applyFont()
        textView.requestLayout()
        textView.post { requestMeasure() }
    }

    private fun toHebrewNumber(number: Int): String {
        if (number <= 0) return ""

        var n = number
        val sb = StringBuilder()

        val tens = arrayOf("", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ")
        val units = arrayOf("", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט")

        if (n >= 100) {
            val h = n / 100
            if (h == 1) sb.append("ק")
            else if (h == 2) sb.append("ר")
            else if (h == 3) sb.append("ש")
            else if (h == 4) sb.append("ת")
            else if (h >= 5) {
                repeat(h) { sb.append("ק") }
            }
            n %= 100
        }

        if (n == 15) {
            sb.append("טו")
        } else if (n == 16) {
            sb.append("טז")
        } else {
            val t = n / 10
            if (t > 0) sb.append(tens[t])
            val u = n % 10
            if (u > 0) sb.append(units[u])
        }

        return sb.toString()
    }

    private data class ColorTarget(
            val id: Int,
            val startText: Int,
            val targetText: Int,
            val startNum: Int,
            val targetNum: Int
    )

    private fun animateSelectionUpdate() {
        colorAnimator?.cancel()

        val itemTargets = ArrayList<ColorTarget>()
        val dimmedColor = getDimmedColor()
        val numberColor = Color.GRAY
        val hasSelection = selectedIds.isNotEmpty()

        verses.forEach { verse ->
            val isSelected = selectedIds.contains(verse.id)
            val isDimmed = hasSelection && !isSelected
            val targetTextColor = if (isDimmed) dimmedColor else textColor
            val targetNumColor = if (isDimmed) dimmedColor else numberColor

            val startTextColor = verseTextColors[verse.id] ?: textColor
            val startNumColor = verseNumberColors[verse.id] ?: numberColor

            if (startTextColor != targetTextColor || startNumColor != targetNumColor) {
                itemTargets.add(
                        ColorTarget(
                                verse.id,
                                startTextColor,
                                targetTextColor,
                                startNumColor,
                                targetNumColor
                        )
                )
            }
        }

        if (itemTargets.isEmpty()) return

        colorAnimator =
                android.animation.ValueAnimator.ofFloat(0f, 1f).apply {
                    duration = 200 // 200ms smooth transition
                    addUpdateListener { animator ->
                        val fraction = animator.animatedFraction
                        itemTargets.forEach { target ->
                            verseTextColors[target.id] =
                                    blendColors(target.startText, target.targetText, fraction)
                            verseNumberColors[target.id] =
                                    blendColors(target.startNum, target.targetNum, fraction)
                        }
                        textView.invalidate()
                    }
                    start()
                }
    }

    private fun blendColors(color1: Int, color2: Int, ratio: Float): Int {
        val inverseRatio = 1f - ratio
        val a = (Color.alpha(color1) * inverseRatio + Color.alpha(color2) * ratio).toInt()
        val r = (Color.red(color1) * inverseRatio + Color.red(color2) * ratio).toInt()
        val g = (Color.green(color1) * inverseRatio + Color.green(color2) * ratio).toInt()
        val b = (Color.blue(color1) * inverseRatio + Color.blue(color2) * ratio).toInt()
        return Color.argb(a, r, g, b)
    }
}
