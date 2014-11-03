﻿/*
 * Name: Tych Panel Options
 * Author: Reimund Trost (c) 2011-2012
 * Email: reimund@lumens.se
 * Website: http://lumens.se/tychpanel/
 *
 * Description: Options dialog for the Tych Panel script.
 */


//@include Tych%20Panel%20Only/constants.jsx
//@include Tych%20Panel%20Only/settings.jsx
//@include Tych%20Panel%20Only/PSSettings.jsx
//@include Tych%20Panel%20Only/colorpicker.jsx
//@include Tych%20Panel%20Only/actions.jsx

//settings.clearSettings()
//settings.saveSettings();

// Use stored settings if they exist, defaults otherwise.

var TychOptions = function(tp_settings)
{
	var window_res, w;

	window_res = "dialog { \
		orientation: 'row', \
		alignChildren: 'top', \
		main_group: Group { \
			orientation: 'column', \
			alignChildren: 'fill', \
			tab_buttons: Group { \
				alignChildren: 'row', \
				appearance_button: IconButton { \
					title: 'Appearance', \
					titleLayout: { \
						alignment: ['left', 'center'], \
						margins: [2, 2, 2, 2] \
					}, \
					bounds: [0, 0, 100, 23] \
				}, \
				output_button: IconButton { \
					title: 'Output', \
					titleLayout: { \
						alignment: ['left', 'center'], \
						margins: [2, 2, 2, 2] \
					}, \
					bounds: [0, 0, 74, 23] \
				}, \
				misc_button: IconButton { \
					title: 'Misc', \
					titleLayout: { \
						alignment: ['left', 'center'], \
						margins: [2, 2, 2, 2] \
					}, \
					bounds: [0, 0, 74, 23] \
				}, \
			}, \
			tab: Group { \
				orientation: 'column', \
				alignChildren: 'fill', \
				minimumSize: [450, 10] \
			}, \
		}, \
		button_group: Group { \
			orientation: 'column', \
			ok_button: Button { text: 'Ok' }, \
			cancel_button: Button { text: 'Cancel' } \
		}, \
	}";

	this.w =  new Window(window_res, 'Tych Panel Options');
	
	this.toggle_tab('appearance');
	this.w.show();

}


TychOptions.prototype.setup_ui = function()
{
	var thiss, w, tab_buttons;

	thiss = this;
	w = this.w;
	tab_buttons = w.main_group.tab_buttons;
	this.action_rows = [];

	tab_buttons.appearance_button.onClick = function() { thiss.toggle_tab('appearance'); }
	tab_buttons.output_button.onClick = function() { thiss.toggle_tab('output'); }
	tab_buttons.misc_button.onClick = function() { thiss.toggle_tab('misc'); }

	if (this.current_tab == 'appearance') {
		w.main.fit_size_group.input.enabled = w.main.resize_to_fit.width_button.value || w.main.resize_to_fit.height_button.value;

		w.main.bg_color_group.hex.onChange = function() { hex_change(this); }
		w.main.border_color_group.hex.onChange = function() { hex_change(this); }
		w.main.bg_color_group.color_button.onClick = function() { color_click(this); }
		w.main.border_color_group.color_button.onClick = function() { color_click(this); }
		w.main.bg_color_group.hex.notify('onChange');
		w.main.border_color_group.hex.notify('onChange');

		w.main.resize_to_fit.width_button.onClick
			= w.main.resize_to_fit.height_button.onClick
			= function() 
		{
			w.main.fit_size_group.input.enabled = true;
			w.main.fit_size_group.label.text = 'Target ' + (w.main.resize_to_fit.width_button.value ? 'width' : 'height');
		};

		w.main.resize_to_fit.none_button.onClick = function() 
		{
			w.main.fit_size_group.input.enabled = false;
		};

		w.compositing.composite_group.composite.onClick = function()
		{
			w.compositing.maintain_group.enabled = this.value;
		};

	} else if (this.current_tab == 'output') {

		w.output.directory.button.onClick = function()
		{
			w.output.directory.input.text = Folder.selectDialog('Please select a directory.').fsName;
		}

		w.output.autosave_group.autosave.onClick = function()
		{
			w.output.autoclose.enabled = this.value;
			w.output.directory.enabled = this.value;
			w.output.filename.enabled = this.value && !w.output.derive_filename_group.derive_filename.value;
			w.output.save_each_layer_group.enabled = this.value;;
			w.output.derive_filename_group.enabled = this.value;;
			w.output.save_types.jpeg.enabled = this.value;
			w.output.save_types.psd.enabled = this.value;
			w.output.quality.enabled = this.value && w.output.save_types.jpeg.value;
		};

		w.output.derive_filename_group.derive_filename.onClick = function()
		{
			w.output.filename.enabled = !this.value;
		}

		w.output.save_types.jpeg.onClick = function() { w.output.quality.enabled = this.value; };
		w.output.quality.slider.onChange = function() { w.output.quality.input.text = Math.round(this.value); };
		w.output.quality.slider.onChanging = function() { w.output.quality.input.text = Math.round(this.value); };

		w.output.quality.input.onChange = function()
		{
			w.output.quality.slider.value = num_or_default(Math.round(Number(this.text)), 'jpeg_quality');
			this.text = w.output.quality.slider.value;
		};

	} else if (this.current_tab == 'misc') {

		for (var i in tp_settings.actions)
			this.new_action_row(w.actions, tp_settings.actions[i]);

		this.new_action_row(w.actions);

		w.actions.header_group.button_group.clear_button.onClick = function()
		{
			// First remove all rows.
			for (var i in thiss.action_rows)
				w.actions.remove(thiss.action_rows[i]);

			thiss.action_rows = [];

			// Then create an empty one.
			thiss.new_action_row(w.actions);

			w.layout.layout(true);
		}

		// Layout is needed after rows have been added.
		w.layout.layout(true);

		// Masks must be enabled with smart objects since it's the most
		// convenient way to add seams. It doesn't really make sense to have
		// smart objects without masks either.
		w.misc.smart_object_group.smart_object.onClick = function()
		{
			if (w.misc.smart_object_group.smart_object.value)
				w.misc.layer_mask_group.layer_mask.value = w.misc.smart_object_group.smart_object.value;
			
		};

		// If smart objects is enabled when turning masks off, smart objects
		// will be disabled as well.
		w.misc.layer_mask_group.layer_mask.onClick = function()
		{
			if (!w.misc.layer_mask_group.layer_mask.value)
				w.misc.smart_object_group.smart_object.value = w.misc.layer_mask_group.layer_mask.value;
		};

		w.about.about_button.onClick = function()
		{
			var about_window_res, large_font, small_font, g;

			large_font = ScriptUI.newFont(thiss.w.graphics.font.name, ScriptUI.FontStyle.BOLD, 20);
			small_font = ScriptUI.newFont(thiss.w.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);

			about_window_res = "dialog { \
				orientation: 'column', \
				alignChildren: 'center', \
				spacing: 5, \
				margins: [50, 50, 50, 20], \
				header_group: Group { \
					orientation: 'column', \
					spacing: 1, \
					heading: StaticText { \
						text: 'Tych Panel', \
						margins: [0, 0, 0, 0], \
					}, \
					author: StaticText { text: 'by Reimund Trost', }, \
				}, \
				sep1: Group { \
					margins: [0, 5, 0, 5], \
					text: StaticText { text: '' } \
				}, \
				pic: Image { \
					image: '" + escape(reimund.fsName) + "', \
					helpTip: 'Photo by Isak Barbopoulos' \
				}, \
				twitter_text: StaticText { text: 'Follow me on Twitter', } \
				sep2: Group { \
					margins: [0, 5, 0, 5], \
					text: StaticText { text: '' } \
				}, \
				bottom_line: Group { \
					orientation: 'row', \
					spacing: 50, \
					www: StaticText { text: 'Website', } \
					license: StaticText { text: 'Licensed under the MIT license', } \
					donate: StaticText { text: 'Donate', } \
				}, \
				sep3: Group { \
					margins: [0, 2, 0, 2], \
					text: StaticText { text: '' } \
				}, \
			}";


			aw =  new Window(about_window_res, 'About Tych Panel');

			aw.header_group.heading.graphics.font = large_font;
			aw.header_group.author.graphics.font = small_font;
			aw.bottom_line.www.graphics.font = small_font;
			aw.bottom_line.license.graphics.font = small_font;
			aw.bottom_line.donate.graphics.font = small_font;

			link_blue = [0, 0.4, 1];

			g = aw.twitter_text.graphics;
			g.font = small_font;
			g.foregroundColor = g.newPen(g.PenType.SOLID_COLOR, link_blue, 1);

			g = aw.bottom_line.www.graphics;
			g.foregroundColor = g.newPen(g.PenType.SOLID_COLOR, link_blue, 1);

			g = aw.bottom_line.donate.graphics;
			g.foregroundColor = g.newPen(g.PenType.SOLID_COLOR, link_blue, 1);

			g = aw.graphics;
			g.backgroundColor = g.newBrush(g.BrushType.SOLID_COLOR, [1, 1, 1], 1);

			aw.twitter_text.onClick = function() { open_url('http://twitter.com/reimundtrost/'); }
			aw.bottom_line.www.onClick = function() { open_url('http://lumens.se/tychpanel/'); }
			aw.bottom_line.donate.onClick = function() { open_url('http://lumens.se/tychpanel/#donate'); }

			aw.onClick
				= aw.pic.onClick
				= aw.bottom_line.onClick
				= function() { aw.close(2); };
			
			aw.show();
		}

	}

	w.button_group.ok_button.onClick = function()
	{
		thiss.set_settings(thiss.current_tab);
		settings.addEntry('tp_settings', tp_settings);
		settings.saveSettings();

		w.close(1);
	};

	w.button_group.cancel_button.onClick = function() { w.close(2); };

}


function num_or_default(str, name)
{
	var value = Number(str);
	return isNaN(value) ? defaults[name] : value;
}


function escape(str)
{
	return str.replace(/\\/g, '\\\\');
}


function change_color(color, el)
{
	var color_array = [
		color.rgb.red / 255,
		color.rgb.green / 255,
		color.rgb.blue / 255,
		1
	];

	try
	{
		// Get ScriptUIGraphics object associated with the element.
		var g = el.graphics;
		g.foregroundColor = g.newPen(g.PenType.SOLID_COLOR, color_array, 1);
		g.backgroundColor = g.newBrush (g.BrushType.SOLID_COLOR, color_array, 1);
	}
	catch(error){ alert(error); }
}


TychOptions.prototype.get_main_res = function()
{
	return "panel { \
		visible: true, \
		text: 'General', \
		alignChildren: 'left', \
		spacing_group: Group { \
			label: StaticText { \
				text: 'Image spacing', \
				helpTip: 'The distance between pictures (in pixels).' \
			}, \
			input: EditText { \
				text: '" + tp_settings.spacing + "', \
				preferredSize: [40, 20], \
				helpTip: 'The distance between pictures (in pixels).' \
			} \
		}, \
		bg_color_group: Group { \
			label: StaticText { \
				text: 'Background color', \
				helpTip: 'The background layer will be filled with this color.' \
 			}, \
			color_button: EditText { \
				text: '', \
				preferredSize: [25, 23], \
				helpTip: 'The background layer will be filled with this color.' \
			}, \
			hex: EditText { \
				text: '" + tp_settings.background_color + "', \
				preferredSize: [70, 23], \
				helpTip: 'The background layer will be filled with this color.' \
			}, \
		}, \
		resize_label: Group { \
			text: StaticText { text: 'Resize to fit' }, \
			margins: [0, 20, 0, 0] \
		}, \
		resize_to_fit: Group { \
			width_button: RadioButton { \
				preferredSize: [60, -1], \
				text: 'Width', \
				value: " + tp_settings.fit_width + " \
			}, \
			height_button: RadioButton { \
				preferredSize: [60, -1], \
				text: 'Height', \
				value: " + tp_settings.fit_height + " \
			}, \
			none_button: RadioButton { \
				text: 'Don\\'t resize', \
				value: " + (!tp_settings.fit_width && !tp_settings.fit_height) + " \
			}, \
		}, \
		fit_size_group: Group { \
			label: StaticText { \
				text: 'Target " + (tp_settings.fit_width ? 'width' : 'height') + "', \
				helpTip: 'The target size, not counting the width of the outer border.', \
				preferredSize: [85, 20], \
			} \
			input: EditText { \
				text: '" + tp_settings.fit_size + "', \
				preferredSize: [50, 20], \
				helpTip: 'The target size, not counting the width of the outer border.' \
			}, \
		}, \
		border_group: Group { \
			margins: [0, 20, 0, 0] \
			label: StaticText { \
				text: 'Border size', \
				preferredSize: [80, 0], \
				helpTip: 'The width of the outer border (in pixels).', \
			}, \
			top: Group { \
				orientation: 'column', \
				alignChildren: 'left', \
				label: StaticText { \
					text: 'Top', \
					preferredSize: [30, 4], \
					helpTip: 'Top border width (in pixels).' \
				} \
				input: EditText { \
					text: " + tp_settings.border[0] + ", \
					preferredSize: [60, 20], \
					helpTip: 'Top border width (in pixels).' \
				}, \
			}, \
			right: Group { \
				orientation: 'column', \
				alignChildren: 'left', \
				label: StaticText { \
					text: 'Right', \
					preferredSize: [30, 4], \
					helpTip: 'Right border width (in pixels).' \
				}, \
				input: EditText { \
					text: " + tp_settings.border[1] + ", \
					preferredSize: [60, 20], \
					helpTip: 'Right border width (in pixels).' \
				}, \
			}, \
			bottom: Group { \
				orientation: 'column', \
				alignChildren: 'left', \
				label: StaticText { \
					text: 'Bottom', \
					preferredSize: [40, 4], \
					helpTip: 'Bottom border width (in pixels).' \
				}, \
				input: EditText { \
					text: " + tp_settings.border[2] + ", \
					preferredSize: [60, 20], \
					helpTip: 'Bottom border width (in pixels).' \
				}, \
			}, \
			left: Group { \
				orientation: 'column', \
				alignChildren: 'left', \
				label: StaticText { \
					text: 'Left', \
					preferredSize: [30, 4], \
					helpTip: 'Left border width (in pixels).' \
				}, \
				input: EditText { \
					text: " + tp_settings.border[3] + ", \
					preferredSize: [60, 20], \
					helpTip: 'Left border width (in pixels).' \
				}, \
			}, \
		}, \
		border_color_group: Group { \
			label: StaticText { \
				text: 'Border color', \
				preferredSize: [80, 15], \
				helpTip: 'The color of the outer border.', \
			}, \
			color_button: EditText { \
				text: '', \
				preferredSize: [25, 23], \
				helpTip: 'The color of the outer border.', \
			}, \
			hex: EditText { \
				text: '" + tp_settings.border_color + "', \
				preferredSize: [70, 23], \
				helpTip: 'The color of the outer border.', \
			}, \
		}, \
		corner_radius_group: Group { \
			margins: [0, 20, 0, 0] \
			label: StaticText { \
				text: 'Corner radius', \
				preferredSize: [90, 0], \
				helpTip: 'Adds rounded corners with the specified radius (in pixels).', \
			}, \
			top_left: Group { \
				orientation: 'column', \
				alignChildren: 'left', \
				label: StaticText { \
					text: 'Top left', \
					preferredSize: [60, 4], \
					helpTip: 'Top left corner radius (in pixels).' \
				} \
				input: EditText { \
					text: " + tp_settings.corner_radius[0] + ", \
					preferredSize: [60, 20], \
					helpTip: 'Top left corner radius (in pixels).' \
				}, \
			}, \
			top_right: Group { \
				orientation: 'column', \
				alignChildren: 'left', \
				label: StaticText { \
					text: 'Top right', \
					preferredSize: [60, 4], \
					helpTip: 'Top right corner radius (in pixels).' \
				}, \
				input: EditText { \
					text: " + tp_settings.corner_radius[1] + ", \
					preferredSize: [60, 20], \
					helpTip: 'Top right corner radius (in pixels).' \
				}, \
			}, \
			bottom_right: Group { \
				orientation: 'column', \
				alignChildren: 'left', \
				label: StaticText { \
					text: 'Bottom right', \
					preferredSize: [60, 4], \
					helpTip: 'Bottom right corner radius (in pixels).' \
				}, \
				input: EditText { \
					text: " + tp_settings.corner_radius[2] + ", \
					preferredSize: [60, 20], \
					helpTip: 'Bottom right corner radius (in pixels).' \
				}, \
			}, \
			bottom_left: Group { \
				orientation: 'column', \
				alignChildren: 'left', \
				label: StaticText { \
					text: 'Bottom left', \
					preferredSize: [60, 4], \
					helpTip: 'Bottom left corner radius (in pixels).' \
				}, \
				input: EditText { \
					text: " + tp_settings.corner_radius[3] + ", \
					preferredSize: [60, 20], \
					helpTip: 'Bottom left corner radius (in pixels).' \
				}, \
			}, \
		}, \
		outer_radius_group: Group { \
			input: Checkbox { \
				text: 'Only apply to outer frame', \
				value: " + !tp_settings.round_all_layers + ", \
				helpTip: 'Only rounds corners on top left, top right, bottom left and bottom right pictures.' \
			}, \
		}, \
	}";
}


TychOptions.prototype.get_compositing_res = function()
{
	return "panel { \
		text: 'Compositing', \
		alignChildren: 'left', \
		composite_group: Group { \
			margins: [0, 10, 0, 0], \
			composite: Checkbox { \
				text: 'Composite with active document', \
				value: " + tp_settings.composite + ", \
			}, \
		}, \
		maintain_label: Group { \
			text: StaticText { text: 'When adding rows and columns, maintain' }, \
			margins: [0, 20, 0, 0] \
		}, \
		maintain_group: Group { \
			maintain_width: RadioButton { \
				preferredSize: [60, -1], \
				text: 'Width', \
				value: " + tp_settings.maintain_width + ", \
			}, \
			maintain_height: RadioButton { \
				preferredSize: [60, -1], \
				text: 'Height', \
				value: " + tp_settings.maintain_height + ", \
			}, \
			maintain_nothing: RadioButton { \
				text: 'Nothing', \
				value: " + (!tp_settings.maintain_width && !tp_settings.maintain_height) + ", \
			}, \
			enabled: " + tp_settings.composite + " \
		}, \
	}";
}


TychOptions.prototype.get_actions_res = function()
{
	return "panel { \
		text: 'Actions', \
		alignChildren: 'left', \
		header_group: Group { \
			margins: [0, 20, 0, 0] \
			label: StaticText { \
				text: 'Run actions:', \
			}, \
			button_group: Group { \
				margins:  [312, 0, 0, 0], \
				clear_button: Button { \
					text: 'Clear', \
					preferredSize: [50, 24], \
				} \
			} \
		}, \
	}";
}


TychOptions.prototype.get_about_res = function()
{
	return "panel { \
		alignChildren: 'right', \
		about_button: Button { \
			text: 'About...', \
			preferredSize: [80, 35], \
		} \
	}";
}


TychOptions.prototype.get_misc_res = function()
{
	return "panel { \
		text: 'Miscelleneous', \
		alignChildren: 'left', \
		reorder_group: Group { \
			margins: [0, 20, 0, 0] \
			reorder: Checkbox { \
				text: 'Enable reorder dialog', \
				value: " + tp_settings.reorder + " \
			} \
		}, \
		bridge_group: Group { \
			use_bridge: Checkbox { \
				text: 'Use selected images in Adobe Bridge', \
				value: " + tp_settings.use_bridge_selection + " \
			} \
		} \
		smart_object_group: Group { \
			smart_object: Checkbox { \
				text: 'Convert to smart objects.', \
				value: " + tp_settings.convert_to_smart_objects + " \
			} \
			margins: [0, 20, 0, 0] \
		} \
		layer_mask_group: Group { \
			layer_mask: Checkbox { \
				text: 'Mask layers', \
				value: " + tp_settings.mask_layers + " \
			}, \
		}, \
	}";
}


TychOptions.prototype.get_output_res = function()
{
	return "panel { \
		text: 'Output', \
		alignChildren: 'left', \
		autosave_group: Group { \
			margins: [0, 20, 0, 0] \
			autosave: Checkbox { \
				text: 'Save generated images', \
				value: " + tp_settings.autosave + " \
			}, \
		}, \
		directory: Group { \
			label: StaticText { text: 'Directory' }, \
			input: EditText { \
				text: '" + escape(new Folder(tp_settings.save_directory).fsName) + "', \
				preferredSize: [300, 20] \
			}, \
			button: Button { text: 'Browse...' }, \
			enabled: " + tp_settings.autosave + " \
		}, \
		filename: Group { \
			label: StaticText { text: 'File name' }, \
			input: EditText { \
				text: '" + tp_settings.filename + "', \
				preferredSize: [200, 20] \
			}, \
			enabled: " + (tp_settings.autosave && !tp_settings.derive_filename) + ", \
		}, \
		save_each_layer_group: Group { \
			save_each_layer: Checkbox { \
				text: 'Save each individual layer', \
				value: " + tp_settings.save_each_layer + ", \
			}, \
			enabled: " + tp_settings.autosave + ", \
		}, \
		derive_filename_group: Group { \
			derive_filename: Checkbox { \
				text: 'Derive file name from input files', \
				value: " + tp_settings.derive_filename + ", \
			}, \
			enabled: " + tp_settings.autosave + ", \
		}, \
		save_types: Group { \
			jpeg: Checkbox { \
				text: 'Jpeg', \
				preferredSize: [45, -1], \
				value: " + tp_settings.output_formats.jpg + ", \
				enabled: " + tp_settings.autosave + ", \
			}, \
			png: Checkbox { \
				preferredSize: [45, -1], \
				text: 'Png', \
				value: " + tp_settings.output_formats.png + ", \
				enabled: " + tp_settings.autosave + ", \
			}, \
			psd: Checkbox { \
				preferredSize: [45, -1], \
				text: 'Psd', \
				value: " + tp_settings.output_formats.psd + ", \
				enabled: " + tp_settings.autosave + ", \
			}, \
			margins: [0, 20, 0, 0], \
		}, \
		quality: Group { \
			label: StaticText { \ text: 'JPEG Quality' \ }, \
			slider: Slider { \
				value: '" + tp_settings.jpeg_quality + "', \
				minvalue: 0, \
				maxvalue: 12, \
			}, \
			input: EditText { \
				text: '" + tp_settings.jpeg_quality + "', \
				preferredSize: [35, 20], \
			}, \
		}, \
		autoclose: Checkbox { \
			text: 'Close on save', \
			value: " + tp_settings.autoclose + ", \
			enabled: " + tp_settings.autosave + " \
		} \
	}";
}


TychOptions.prototype.set_settings = function(tab)
{
	// Get values from controls and store them in the settings object.
	switch (tab) {

		case 'appearance':
			tp_settings.spacing = num_or_default(this.w.main.spacing_group.input.text, 'spacing');
			tp_settings.fit_width = this.w.main.resize_to_fit.width_button.value
			tp_settings.fit_height = this.w.main.resize_to_fit.height_button.value
			tp_settings.fit_size = num_or_default(this.w.main.fit_size_group.input.text, 'fit_size');
			tp_settings.composite = this.w.compositing.composite_group.composite.value;
			tp_settings.maintain_width = this.w.compositing.maintain_group.maintain_width.value;
			tp_settings.maintain_height = this.w.compositing.maintain_group.maintain_height.value;
			tp_settings.background_color = this.w.main.bg_color_group.hex.text;
			tp_settings.border_color = this.w.main.border_color_group.hex.text;
			tp_settings.border = [
				Number(this.w.main.border_group.top.input.text),
				Number(this.w.main.border_group.right.input.text),
				Number(this.w.main.border_group.bottom.input.text),
				Number(this.w.main.border_group.left.input.text)
			];
			tp_settings.corner_radius = [
				Number(this.w.main.corner_radius_group.top_left.input.text),
				Number(this.w.main.corner_radius_group.top_right.input.text),
				Number(this.w.main.corner_radius_group.bottom_right.input.text),
				Number(this.w.main.corner_radius_group.bottom_left.input.text)
			];
			tp_settings.round_all_layers = !this.w.main.outer_radius_group.input.value;
			break;

		case 'output':
			tp_settings.autosave = this.w.output.autosave_group.autosave.value;
			tp_settings.save_each_layer = this.w.output.save_each_layer_group.save_each_layer.value;
			tp_settings.autoclose = this.w.output.autoclose.value;
			tp_settings.output_formats.jpg = this.w.output.save_types.jpeg.value;
			tp_settings.output_formats.png = this.w.output.save_types.png.value;
			tp_settings.output_formats.psd = this.w.output.save_types.psd.value;
			tp_settings.jpeg_quality = Math.round(this.w.output.quality.slider.value);
			tp_settings.save_directory = this.w.output.directory.input.text;
			tp_settings.filename = this.w.output.filename.input.text;
			tp_settings.derive_filename = this.w.output.derive_filename_group.derive_filename.value;
			break;

		case 'misc':
			tp_settings.convert_to_smart_objects = this.w.misc.smart_object_group.smart_object.value;
			tp_settings.mask_layers = this.w.misc.layer_mask_group.layer_mask.value;
			tp_settings.reorder = this.w.misc.reorder_group.reorder.value;
			tp_settings.use_bridge_selection = this.w.misc.bridge_group.use_bridge.value;

			var actions = [];

			for (i in this.action_rows)
				if (null != this.action_rows[i].actions.selection 
						&& '' != this.action_rows[i].actions.selection)
					actions.push({
						'set': this.action_rows[i].sets.selection.text,
						'action': this.action_rows[i].actions.selection.text,
						'apply': this.action_rows[i].apply_timing.selection.text
					});

			tp_settings.actions = actions;

			break;
	}
}


TychOptions.prototype.toggle_tab = function(tab)
{
	var panels, small_font;
	
	this.set_settings(this.current_tab);
	this.current_tab = tab;

	panels = [];
	small_font = ScriptUI.newFont(this.w.graphics.font.name, ScriptUI.FontStyle.REGULAR, 10);

	for (var i = 0; i < this.w.main_group.tab_buttons.children.length; i++)
		if (this.w.main_group.tab_buttons.children[i].pressed)
			this.w.main_group.tab_buttons.children[i].toggle();

	for (i = 0; i < this.w.main_group.tab.children.length; i++)
		panels.push(this.w.main_group.tab.children[i]);

	for (j in panels)
		this.w.main_group.tab.remove(panels[j]);

	switch (tab) {

		case 'appearance':
			this.w.main = this.w.main_group.tab.add(this.get_main_res());
			this.w.compositing = this.w.main_group.tab.add(this.get_compositing_res());
			this.w.main_group.tab_buttons.appearance_button.toggle();

			// Set small font for top labels.
			this.w.main.border_group.top.label.graphics.font
				= this.w.main.border_group.right.label.graphics.font
				= this.w.main.border_group.bottom.label.graphics.font
				= this.w.main.border_group.left.label.graphics.font
				= this.w.main.corner_radius_group.top_left.label.graphics.font
				= this.w.main.corner_radius_group.bottom_right.label.graphics.font
				= this.w.main.corner_radius_group.bottom_left.label.graphics.font
				= this.w.main.corner_radius_group.top_right.label.graphics.font
				= this.w.main.corner_radius_group.top_left.label.graphics.font
				= this.w.main.corner_radius_group.bottom_right.label.graphics.font
				= this.w.main.corner_radius_group.bottom_left.label.graphics.font
				= small_font;
			break;

		case 'output':
			this.w.output = this.w.main_group.tab.add(this.get_output_res());
			this.w.main_group.tab_buttons.output_button.toggle();
			break;

		case 'misc':
			this.w.misc = this.w.main_group.tab.add(this.get_misc_res());
			this.w.actions = this.w.main_group.tab.add(this.get_actions_res());
			this.w.about = this.w.main_group.tab.add(this.get_about_res());
			this.w.main_group.tab_buttons.misc_button.toggle();
			break;
	}

	this.w.layout.layout(true);
	this.setup_ui();
}


function hex_change(el)
{
	var bg_color = new SolidColor();

	try {
		bg_color.rgb.hexValue = el.text.substr(1);
		change_color(bg_color, el.parent.color_button);
	} catch (e) {}
}


function color_click(el)
{
	var dummy_doc, picked_color, bg_color;

	if (app.documents.length == 0)
		dummy_doc = app.documents.add(1, 1, 72, 'Dummy document');

	bg_color = colorPicker();
	el.parent.hex.text = '#' + bg_color.rgb.hexValue.toLowerCase();

	change_color(bg_color, el);

	if (dummy_doc)
		dummy_doc.close(SaveOptions.DONOTSAVECHANGES);
}

TychOptions.prototype.new_action_row = function(container, action)
{
	var action_sets, row, thiss;

	this.action_rows.push(container.add('group'));
	row = this.action_rows[this.action_rows.length - 1];

	row.number = row.add('statictext', undefined, this.action_rows.length + '.');

	row.apply_timing = row.add('dropdownlist', undefined);
	row.apply_timing.add('item', 'Before layout');
	row.apply_timing.add('item', 'After layout');
	row.apply_timing.preferredSize = [110, 24];
	row.apply_timing.selection = row.apply_timing.items[0];

	row.sets = row.add('dropdownlist', undefined);
	row.sets.preferredSize = [150, 24];

	row.actions = row.add('dropdownlist', undefined);
	row.actions.preferredSize = [150, 24];

	action_sets = get_action_set_info();
	thiss = this;

	for (var i in action_sets)
		row.sets.add('item', action_sets[i].name);

	row.sets.selection = row.sets.items[0];

	row.sets.onChange = function()
	{
		this.parent.actions.removeAll();

		// Add an empty item used for deleting actions.
		this.parent.actions.add('item', '');

		for (var i in action_sets[this.selection.index].children)
			this.parent.actions.add('item', action_sets[this.selection.index].children[i].name);
	}

	row.actions.onChange = function()
	{
		// Add a new row of action controls only if the last row is set.
		// Don't add new rows when action is set since then we'll get superfluos
		// rows when populating any actions stored in the settings.
		if (thiss.action_rows[thiss.action_rows.length - 1].actions.selection != null
				&& action == undefined) {
			thiss.new_action_row(container);
			container.parent.parent.parent.layout.layout(true);
		}
	}
	
	// Trigger the set dropdown so that the actions are populated.
	row.sets.notify('onChange');

	if (action != undefined) {
		row.sets.select(action.set);
		row.actions.select(action.action);
		row.apply_timing.select(action.apply);
	}
}

DropDownList.prototype.select = function(text)
{
	for (var i = 0; i < this.items.length; i++)
		if (this.items[i].text == text) {
			this.selection = this.items[i];
			break;
		}
}


function open_url(url)
{
	var filename, shortcut;

	filename = 'shortcut.url';
	shortcut = new File(Folder.temp + '/' + filename);

	shortcut.open('w');
	shortcut.writeln('[InternetShortcut]');
	shortcut.writeln('URL=' + url);
	shortcut.writeln();
	shortcut.close();
	shortcut.execute();

	$.sleep(1000)
	shortcut.remove();
};


/**
 * Make custom toggle button.
 *
 * Calling this function redraws the button in the opposite state, ie a pressed
 * button gets unpressed and an unpressed button gets pressed.
 */
IconButton.prototype.toggle = function()
{
	var version, d;
	
	// If we're on Photoshop CS6 or higher, the margin should be 2 pixels less.
	version = app.version.split('.');
	d = version[0] < 13 ? 0 : 2;

	// Use larger graphic for appearance button. Yeah it's butt ugly.
	if (this.title == 'Appearance') {

		if (this.pressed)
			this.image = toggle;
		else
			this.image = toggle_down;

		this.bounds = [0, 0, 100 - d, 23 - d];

	} else {

		if (this.pressed)
			this.image = toggle_small;
		else
			this.image = toggle_down_small;

		this.bounds = [0, 0, 74 - d, 23 - d];
	}

	this.margins = [0, 0, 0, 0];
	this.titleLayout = { alignment: ['center', 'center'], margins: [2 - d, 2 - d, 2 - d, 2 - d] }
	this.pressed = this.pressed == undefined ? true : !this.pressed;
}

var imageRoot         = app.path + '/Presets/Scripts/Tych Panel/Images/';
var toggle            = ScriptUI.newImage(new File(imageRoot + 'toggle-button.png'));
var toggle_down       = ScriptUI.newImage(new File(imageRoot + 'toggle-button-down.png'));
var toggle_small      = ScriptUI.newImage(new File(imageRoot + 'toggle-button-small.png'));
var toggle_down_small = ScriptUI.newImage(new File(imageRoot + 'toggle-button-down-small.png'));
var reimund           = new File(imageRoot + 'reimund.jpg');

var tp_settings = tp_get_settings();
var dialog = new TychOptions(tp_settings);
