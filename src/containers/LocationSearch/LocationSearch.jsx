import React, { PureComponent, PropTypes } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import * as GlobalSearchActions from '../../redux/globalSearch/actions';
import * as GlobalSearchSelectors from '../../redux/globalSearch/selectors';

import { Search } from '../../components';

function mapStateToProps(state) {
  return {
    locationSearchResults: GlobalSearchSelectors.getLocationSearchResults(state),
  };
}

class LocationSearch extends PureComponent {
  static propTypes = {
    dispatch: PropTypes.func,
    locationSearchResults: PropTypes.array,
    router: PropTypes.object,
  }

  constructor(props) {
    super(props);

    // bind handlers
    this.onSearchQueryChange = this.onSearchQueryChange.bind(this);
    this.onSuggestionSelected = this.onSuggestionSelected.bind(this);
  }

  onSuggestionSelected(suggestion) {
    const { router } = this.props;

    const suggestionId = suggestion.id;
    const path = `/location/${suggestionId}`;
    router.push(path);
  }

  /**
   * Callback for when the search query changes
   */
  onSearchQueryChange(query) {
    const { dispatch } = this.props;
    dispatch(GlobalSearchActions.fetchLocationSearchIfNeeded(query));
  }

  render() {
    const { locationSearchResults } = this.props;
    return (
      <Search
        placeholder="Search for a location"
        searchResults={locationSearchResults}
        onSearchChange={this.onSearchQueryChange}
        onSuggestionSelected={this.onSuggestionSelected}
      />
    );
  }
}

export default connect(mapStateToProps)(withRouter(LocationSearch));
