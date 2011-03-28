SPROCKET_OPTS="-I build -I /development/projects/github/ -I /development/projects/github/sidelab/ -I /development/projects/googlecode/"
MINIFY=$1

: ${MINIFY:=false}

echo "Building Tile5"

# sprocketize the source
sprocketize $SPROCKET_OPTS src/tile5.js > dist/tile5.js

# minify
if $MINIFY; then
    java -jar build/google-compiler-20100629.jar \
         --compilation_level SIMPLE_OPTIMIZATIONS \
         --js_output_file dist/tile5.min.js \
         --js dist/tile5.js
fi;

for plugin in renderer.webgl renderer.three
do
    echo "Building Tile5 Plugin: $plugin"
    
    # sprocketize the source
    sprocketize $SPROCKET_OPTS src/js/plugins/$plugin.js > dist/plugins/$plugin.js
    
    # minify
    if $MINIFY; then
        java -jar build/google-compiler-20100629.jar \
             --compilation_level SIMPLE_OPTIMIZATIONS \
             --js_output_file dist/plugins/$plugin.min.js \
             --js dist/plugins/$plugin.js
    fi;
done;

# copy the engines across
# TODO: minify the engines
cp src/js/geo/engines/*.js dist/geo/

# copy the styles across
cp src/style/* dist/style/