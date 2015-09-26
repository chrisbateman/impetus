Impetus.js
=========
Add momentum to anything. It's like iScroll, except not for scrolling. Supports mouse and touch events.

Check out the demos on the [home page](http://chrisbateman.github.io/impetus).

Impetus will probably never support anything other than simple momentum. If you need scrolling or touch carousels or anything like that, this probably isn't the tool you're looking for.


### Usage ###
```javascript
var myImpetus = new Impetus({
    source: myNode,
    update: function(x, y) {
        // whatever you want to do with the values
    }
});
```
You give it an area to listen to for touch or mouse events, and it gives you the x and y values with some momentum.

Impetus will register itself as an AMD module if it's available.


### Constructor Options ###
<table>
	<thead>
		<tr>
			<th></th>
			<th scope="col">Type</th>
			<th scope="col">Default</th>
			<th scope="col">Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th scope="row" align="left">source (required)</th>
			<td>HTMLElement|String</td>
			<td>-</td>
			<td>Element reference or query string for the target on which to listen for movement.</td>
		</tr>
		<tr>
			<th scope="row" align="left">update (required)</th>
			<td>function(x, y)</td>
			<td>-</td>
			<td>This function will be called with the updated x and y values.</td>
		</tr>
		<tr>
			<th scope="row" align="left">multiplier</th>
			<td>Number</td>
			<td>1</td>
			<td>The relationship between the input and output values</td>
		</tr>
		<tr>
			<th scope="row" align="left">friction</th>
			<td>Number</td>
			<td>0.92</td>
			<td>Rate at which values slow down after you let go</td>
		</tr>
		<tr>
			<th scope="row" align="left">initialValues</th>
			<td>Number[2]</td>
			<td>[0, 0]</td>
			<td>Array of initial x and y values</td>
		</tr>
		<tr>
			<th scope="row" align="left">boundX</th>
			<td>Number[2]</td>
			<td>-</td>
			<td>Array of low and high values. X values will remain within these bounds</td>
		</tr>
		<tr>
			<th scope="row" align="left">boundY</th>
			<td>Number[2]</td>
			<td>-</td>
			<td>Array of low and high values. X values will remain within these bounds</td>
		</tr>
		<tr>
			<th scope="row" align="left">bounce</th>
			<td>Boolean</td>
			<td>true</td>
			<td>Whether to stretch and rebound values when pulled outside the bounds</td>
		</tr>
	</tbody>
</table>


### Methods ###
<table>
	<thead>
		<tr>
			<th></th>
			<th scope="col">Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th scope="row" align="left">.pause()</th>
			<td>Disable movement processing</td>
		</tr>
		<tr>
			<th scope="row" align="left">.resume()</th>
			<td>Re-enable movement processing</td>
		</tr>
		<tr>
			<th scope="row" align="left">.setMultiplier( &lt;number&gt; )</th>
			<td>Adjust the multiplier in flight</td>
		</tr>
		<tr>
			<th scope="row" align="left">.setValues( &lt;number&gt; , &lt;number&gt; )</th>
			<td>Adjust the current x and y output values</td>
		</tr>
	</tbody>
</table>


### Browser Support ###
Chrome, Firefox, Safari, Opera, IE 9+, iOS, Android. Support for IE 8 can be achieved by adding a polyfill for addEventListener.

