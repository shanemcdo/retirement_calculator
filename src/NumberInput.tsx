import type { Component, Signal } from 'solid-js';

import { Show, createEffect, createUniqueId } from 'solid-js';
import { deleteURLParam, getURLParam, setURLParam } from './util';

import styles from './NumberInput.module.css';

type Props = {
	name: string,
	valueSignal: Signal<number>,
	defaultValue?: number,
	step?: number,
	disabledFieldSignal?: Signal<string>,
};

const NumberInput: Component<Props> = props => {
	const id = createUniqueId();
	const [value, setValue] = props.valueSignal;
	const param = getURLParam(props.name);
	if(param !== null) {
		setValue(parseFloat(param));
	}
	createEffect(() => {
		if(props.defaultValue === value()) {
			deleteURLParam(props.name);
		} else {
			setURLParam(props.name, value().toString());
		}
	})
	const disabled = () => (
		props.disabledFieldSignal !== undefined &&
		props.disabledFieldSignal![0]() === props.name
	);
	return <>
		<span>
			<Show when={props.disabledFieldSignal !== undefined && !disabled()}>
				<button onclick={() => {
					console.log(props.name);
					props.disabledFieldSignal![1](props.name);
				}}>disable</button>
			</Show>
			<label for={id} >{ props.name }:</label>
		</span>
		<input
			type="number"
			value={value()}
			class={styles.number_input}
			id={id}
			step={props.step}
			disabled={disabled()}
			onChange={(e) => {
				setValue(e.target.valueAsNumber);
			}}
		/>
	</>;
}

export default NumberInput;

