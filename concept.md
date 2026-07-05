# overview
this is a soundboard website to be used during traveller (the hard sci-fi) pen-and-paper sessions. its purpose is to procedurally generate soundtracks for the players with a few parameters which the referee (the game master) can configure on their smartphone and update during the session. since mainly the referee will be using the app, user and referee are used interchangably below.

# The soundfile library
The whole application is based on a library of annotated soundfiles (which are CC-BY), described in `data/library.csv`. The library is organized in 3 folders, matching the `category` column: `soundtrack-loop`, `fx-loop`, `fx`. The soundfiles in the library, as well as their annotations, are entered manually by the developer of the application. Each soundfile also has a defined name and author.

## Soundtrack Loops
- these form the basis of the generated soundtracks
- each soundtrack loop has exactly one intensity (1, 2, or 3), stored in the `intensity` column
- intensity 1 means: subtle background ambient. not melodic
- intensity 2 means: less subtle ambient, can be slightly melodic
- intensity 3 means: composed music with themes, melodies, chords, movements, etc.
- each soundtrack loop also has one or more moods (cheerful, mysterious, dangerous, epic, neutral), stored in the `mood` column as a semicolon-separated list (e.g. `mysterious;dangerous`). list to be extended later

## FX Loops
- FX loops are used to enhance the soundtrack loops by overlaying zero, one or more of them
- each FX loop is just a named soundfile — the referee picks specific fx loops directly rather than by tag/category

## FX
- FX are singular sounds which are played back via a soundboard by the referee
- each FX is just a named soundfile, identified by its name in the soundboard

# features
## 1. Soundtrack Generator
With an input of the below parameters, a looping soundtrack is created by randomly selecting sounds from the soundfile library. 

### Input Parameters
1. Intensity: must be 1, 2 or 3
2. Mood: must be one of the moods defined in the soundfile library (cheerful, mysterious, ...)
3. FX Loops: can be zero, one, or more specific fx loops from the soundfile library (engine_room, ...)

### Generating a Soundtrack out of the Parameters
- first, select a soundtrack loop matching the intensity and mood at random
- for each fx loop chosen by the referee, overlay that soundfile
- when the soundtrack is played, both the soundtrack loop and the fx loop are played in a loop
- (after some testing, we will define how the start and end of the loops are smoothed)
- (later on, we will potentially refine this algorithm to make the soundtracks more dynamic, for example randomly increase volume of the loops, introduce further effects like reverb, etc.)

### Randomizing the Soundtrack
There shall be a way to randomize the input parameters altogether. the referee may choose to start playing a random soundtrack with a defined UI interaction. There are some cases to consider, based on which input the referee already selected before randomizing:

- if intensity is undefined, select a random intensity
- if mood is undefined, select a random mood
- if fx loops are undefined, randomly select a number of them based on the intensity. intensity 1: 2 fx loops. intensity 2: 1 fx loop. intensity 3: 0 fx loops
- with these randomly generated input parameters, a soundtrack is generated in the usual way

### Basic Control Features
Apart from the selection of input parameters, there are 3 main interactions for the soundtrack feature.

1. generate: if all input parameters are defined, the soundtrack is generated and starts playing. if a soundtrack is currently playing, there is a 5 second transition
2. stop: stops playing the current soundtrack
3. play: plays the current soundtrack (without generating a new one)

We have to consider some special cases:
- stop -> generate: a new soundtrack is generated and starts playing
- (potentially more special cases to be added)

## 2. Soundboard
There is one interaction for each of the soundfiles in the fx library. It triggers instant, one-time playback of the corresponding soundfile. These interactions can be made in rapid succession and the corresponding soundfiles are played back overlappingly. A maximum of 3 fx can be played back at the same time. In case 3 fx are already playing, the interaction is ignored.

## 3. Attribution
At any time, name and author of any soundfiles playing are shown to the referee. For looping soundfiles, they are shown persistently. For fx, they are shown as long as the fx plays back.

# UI
The UI will be refined later on. The most important concepts are:
- optimized for smartphone use
- optimally, everything fits on one screen
- a barebones, greyscales style with a monospace font shall be used
- the most prominent part of the UI shall be given to the soundboard, the basic control features and the attribution
- the input parameter selection can be moved to the background (e.g. by a collapsible section) since they are not used that often