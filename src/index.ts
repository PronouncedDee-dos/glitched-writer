// import { random, filterDuplicates } from './utils'
// eslint-disable-next-line import/no-cycle
import Options from './options'
import State from './state'
// @ts-ignore
// eslint-disable-next-line import/no-cycle
import Char from './char'

import { ConstructorOptions } from './types'

// eslint-disable-next-line no-unused-vars
type StepCallback = (string: string) => void

// @ts-ignore
export default class GlitchedWriter {
	options: Options
	state: State
	charTable: Char[] = []
	goalString: string | null = null
	stepCallback: StepCallback | null = null

	constructor(options?: ConstructorOptions, stepCallback?: StepCallback) {
		this.options = new Options(this, options)
		if (stepCallback) this.stepCallback = stepCallback
		this.state = new State()
	}

	get string(): string {
		const charTableMap = this.charTable.map(char => char.string)

		return [
			this.options.getAppendedText('leading'),
			charTableMap.join(''),
			this.options.getAppendedText('trailing'),
		].join('')
	}

	emitStep(): void {
		console.log('string:', this.string)
		if (this.stepCallback) this.stepCallback(this.string)
	}

	async write(string: string) {
		const previous = this.string
		this.goalString = string
		this.charTable.forEach(char => (char.stop = true))
		this.charTable = []
		this.state.nGhosts = 0

		if (this.options.startingText === 'matching') {
			let ji = -1
			Array.from(string).forEach((l, i) => {
				const found = previous.indexOf(l, ji)

				if (found !== -1) {
					const appendedText = previous.substring(ji + 1, found)
					this.charTable.push(new Char(l, l, this, appendedText))
					ji = found
					this.state.nGhosts += appendedText.length
				} else this.charTable.push(new Char('', l, this))
			})
		} else
			Array.from(string).forEach((l, i) => {
				const statringLetter =
					this.options.startingText === 'previous' && previous[i]
						? previous[i]
						: ' '
				this.charTable.push(new Char(statringLetter, l, this))
			})

		this.pause()
		return this.play()
	}

	async play() {
		const playList: Promise<boolean>[] = [],
			{ goalString, charTable } = this

		if (!goalString || this.state.isTyping) return false

		this.state.play()

		charTable.forEach(char => playList.push(char.type()))

		try {
			const finished = (await Promise.all(playList)).every(result => result)
			finished && this.state.finish()
			return finished
		} catch (error) {
			console.error(error)
			return false
		}
	}

	pause() {
		this.state.pause()
	}
}

const exampleWriter = new GlitchedWriter({
	trailingText: { value: ' ▓', display: 'when-typing' },
})

exampleWriter.write('Time To Die').then(res => console.log('Time to die', res))

setTimeout(() => {
	exampleWriter.pause()
}, 1000)

setTimeout(() => {
	exampleWriter.play().then(res => console.log('play', res))
}, 2300)

setTimeout(() => {
	exampleWriter
		.write('Something')
		.then(res => console.log('another write', res))
}, 4000)
