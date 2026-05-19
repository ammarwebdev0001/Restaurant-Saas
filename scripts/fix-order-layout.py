from pathlib import Path

p = Path(__file__).resolve().parents[1] / "components" / "order" / "order-page.tsx"
c = p.read_text(encoding="utf-8")

# Close nav after category row
c = c.replace(
    "              ))}\n            </div>\n\n            <motion.div className=\"mb-6",
    "              ))}\n              </div>\n            </nav>\n\n            <motion.div className=\"mb-6",
)
# Fix mistaken motion.div if present from partial edits
c = c.replace(
    "              ))}\n            </motion.div>\n\n            <motion.div className=\"mb-6",
    "              ))}\n              </div>\n            </nav>\n\n            <div className=\"mb-6",
)

c = c.replace("          </main>", "          </div>")

old_aside = """        </div>
      </motion.div>

      <aside className="sticky top-0 rounded-2xl border border-border bg-card p-4 max-h-[70vh]">"""
new_aside = """          <aside className="flex w-full shrink-0 flex-col lg:w-[20%] lg:min-w-[220px] sticky top-6 self-start max-h-[calc(100vh-5rem)] rounded-2xl border border-border bg-card p-4">"""
c = c.replace(
    """        </div>
      </div>

      <aside className="sticky top-0 rounded-2xl border border-border bg-card p-4 max-h-[70vh]">""",
    """          <aside className="flex w-full shrink-0 flex-col lg:w-[20%] lg:min-w-[220px] sticky top-6 self-start max-h-[calc(100vh-5rem)] rounded-2xl border border-border bg-card p-4">""",
)

# Close flex row after aside
c = c.replace(
    "      </aside>\n\n      <ProductCustomizeDialog",
    "          </aside>\n        </div>\n\n      <ProductCustomizeDialog",
)

# Fix any motion.div typos in mb-6 search row
c = c.replace('<motion.div className="mb-6 flex flex-col', '<div className="mb-6 flex flex-col')

p.write_text(c, encoding="utf-8")
print("done")
