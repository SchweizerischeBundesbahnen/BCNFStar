import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-settings-element',
  templateUrl: './settings-element.component.html',
  styleUrls: ['./settings-element.component.css']
})

/**
 * Builds UI for one specific configuration option.
 * Recieves a control that handles value changes for this option,
 * and the name of the option.
 * Displays a checkbox if the control contains a boolean value, otherwise a textbox.
 */
export class SettingsElementComponent implements OnInit {
  @Input() public control!: FormControl;
  @Input() public name!: string;

  public isBool: boolean = false;


  ngOnInit(): void {
    this.isBool = typeof this.control.value == 'boolean'
  }

  // Tooltips specific for one setting
  public tooltips: Record<string, string> = {
    // all
    memory:
      'Maxmimum allowed memory usage of metanome. Java memory string, e.g. 512M or 4G. If empty: 75% of total memory. Ineffective for rust',
    // HyFD
    NULL_EQUALS_NULL: 'Whether every occurrence of null should be treated as unique or as the same value when finding dependencies',
    MAX_DETERMINANT_SIZE: 'How many columns may form the left-hand-side of an FD (i.e. the key of the created table when splitting) -1 means no limit',
    INPUT_ROW_LIMIT: 'Only look at the first n lines when searching FDs. May be faster on big datasets, but is not recommended because it produces incorrect results. -1 means no limit'
    // FAIDA
  };
}
