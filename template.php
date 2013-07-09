<?php
function bloomcase_preprocess_html(&$variables) {

}

function bloomcase_preprocess_page(&$variables) {
	
}

function bloomcase_preprocess_node(&$variables) {
	if($variables['type'] == 'project') {
		// generate url for json specific for this project:
		$variables['jsonPath'] = url("json/" . $variables['nid'], array('absolute' => TRUE));
	}
}