#!/bin/bash
# Install icons at standard sizes for desktop launchers
ICON_DIR="/opt/Jira Time Tracker/resources/app/resources"
SIZES="16 32 48 64 128 256 512"

for SIZE in $SIZES; do
  SRC="$ICON_DIR/icon-${SIZE}.png"
  if [ -f "$SRC" ]; then
    DEST="/usr/share/icons/hicolor/${SIZE}x${SIZE}/apps"
    mkdir -p "$DEST"
    cp "$SRC" "$DEST/jira-time-tracker.png"
  fi
done

gtk-update-icon-cache /usr/share/icons/hicolor 2>/dev/null || true
update-desktop-database /usr/share/applications 2>/dev/null || true
