
serve:
	java -jar ../plovr.jar serve -p 9810 main-debug.json
build:
	java -jar ../plovr.jar build main.json > deploy/main.js
lint:
	fixjsstyle --strict -r ./src
	gjslint --strict -r ./src
soyweb:
	java -jar ../plovr.jar soyweb -p 9820 --dir .